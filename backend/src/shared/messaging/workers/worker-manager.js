/**
 * WORKER MANAGER
 *
 * Manages the lifecycle of all background workers.
 * Provides centralized control for starting, stopping, and monitoring workers.
 *
 * @module workers/worker-manager
 */

const { spawn } = require('child_process');
const path = require('path');
const logger = require('@utils/logger');
const { WORKER, TIME_CONSTANTS, WORKER_STATUS } = require('@constants');

class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Start all workers
   */
  async startAllWorkers() {
    logger.info('Starting all background workers', { operation: 'WorkerManager' });

    const workerConfigs = [
      {
        name: 'unified-worker',
        script: './unified.worker.js',
        instances: 1, // Single unified worker handles all job types
        env: { ...process.env },
      },
    ];

    for (const config of workerConfigs) {
      for (let i = 0; i < config.instances; i++) {
        const instanceName = config.instances > 1 ? `${config.name}-${i + 1}` : config.name;
        await this.startWorker(instanceName, config.script, config.env);
      }
    }

    logger.info('All workers started successfully', {
      operation: 'WorkerManager',
      workerCount: this.workers.size,
    });
  }

  /**
   * Start a specific worker
   */
  async startWorker(name, script, env = {}) {
    const scriptPath = path.resolve(__dirname, script);

    logger.info(`Starting worker: ${name}`, {
      operation: 'WorkerManager',
      script: scriptPath,
    });

    const workerProcess = spawn('node', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      cwd: process.cwd(),
    });

    // Store worker reference
    this.workers.set(name, {
      process: workerProcess,
      name,
      script,
      startTime: new Date(),
      status: 'starting',
    });

    // Handle worker output
    workerProcess.stdout.on('data', (data) => {
      logger.debug(`Worker ${name} stdout:`, {
        operation: 'WorkerManager',
        worker: name,
        output: data.toString().trim(),
      });
    });

    workerProcess.stderr.on('data', (data) => {
      logger.warn(`Worker ${name} stderr:`, {
        operation: 'WorkerManager',
        worker: name,
        error: data.toString().trim(),
      });
    });

    // Handle worker exit
    workerProcess.on('exit', (code, signal) => {
      const worker = this.workers.get(name);
      if (worker) {
        worker.status = 'stopped';
        worker.exitCode = code;
        worker.exitSignal = signal;
        worker.stopTime = new Date();

        logger.info(`Worker ${name} exited`, {
          operation: 'WorkerManager',
          worker: name,
          exitCode: code,
          exitSignal: signal,
          uptime: worker.stopTime - worker.startTime,
        });

        // Auto-restart if not shutting down
        if (!this.isShuttingDown && code !== 0) {
          logger.warn(`Worker ${name} crashed, attempting restart`, {
            operation: 'WorkerManager',
            worker: name,
          });
          setTimeout(() => this.restartWorker(name), WORKER.RESTART_DELAY_MS);
        }
      }
    });

    workerProcess.on('error', (error) => {
      logger.error(`Worker ${name} process error`, {
        operation: 'WorkerManager',
        worker: name,
        error: error.message,
      });
    });

    // Wait a bit for worker to start
    await new Promise(resolve => setTimeout(resolve, WORKER.STARTUP_WAIT_MS));

    const worker = this.workers.get(name);
    if (worker && worker.process.exitCode === null) {
      worker.status = 'running';
      logger.info(`Worker ${name} started successfully`, {
        operation: 'WorkerManager',
        worker: name,
        pid: worker.process.pid,
      });
    }

    return worker;
  }

  /**
   * Stop all workers
   */
  async stopAllWorkers(signal = 'SIGTERM', timeout = WORKER.SHUTDOWN_TIMEOUT_MS) {
    logger.info('Stopping all workers', {
      operation: 'WorkerManager',
      signal,
      timeout,
    });

    this.isShuttingDown = true;
    const stopPromises = [];

    for (const [name, worker] of this.workers) {
      stopPromises.push(this.stopWorker(name, signal));
    }

    // Wait for all workers to stop or timeout
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        logger.warn('Worker shutdown timeout reached, forcing exit', {
          operation: 'WorkerManager',
        });
        resolve();
      }, timeout);
    });

    await Promise.race([
      Promise.all(stopPromises),
      timeoutPromise,
    ]);

    // Force kill any remaining workers
    for (const [name, worker] of this.workers) {
      if (worker.status !== WORKER_STATUS.STOPPED) {
        logger.warn(`Force killing worker ${name}`, {
          operation: 'WorkerManager',
          worker: name,
        });
        try {
          worker.process.kill('SIGKILL');
        } catch (error) {
          logger.error(`Failed to force kill worker ${name}`, {
            operation: 'WorkerManager',
            worker: name,
            error: error.message,
          });
        }
      }
    }

    this.workers.clear();
    logger.info('All workers stopped', { operation: 'WorkerManager' });
  }

  /**
   * Stop a specific worker
   */
  async stopWorker(name, signal = 'SIGTERM') {
    const worker = this.workers.get(name);
    if (!worker) {
      logger.warn(`Worker ${name} not found`, { operation: 'WorkerManager' });
      return;
    }

    logger.info(`Stopping worker ${name}`, {
      operation: 'WorkerManager',
      worker: name,
      signal,
    });

    worker.status = 'stopping';

    return new Promise((resolve) => {
      // Set up timeout for graceful shutdown
      const timeout = setTimeout(() => {
        logger.warn(`Worker ${name} shutdown timeout, sending SIGKILL`, {
          operation: 'WorkerManager',
          worker: name,
        });
        try {
          worker.process.kill('SIGKILL');
        } catch (error) {
          logger.error(`Failed to kill worker ${name}`, {
            operation: 'WorkerManager',
            worker: name,
            error: error.message,
          });
        }
        resolve();
      }, WORKER.SHUTDOWN_TIMEOUT_MS);

      // Send graceful shutdown signal
      worker.process.kill(signal);

      // Wait for process to exit
      worker.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Restart a worker
   */
  async restartWorker(name) {
    const worker = this.workers.get(name);
    if (!worker) {
      logger.warn(`Cannot restart unknown worker ${name}`, {
        operation: 'WorkerManager',
      });
      return;
    }

    logger.info(`Restarting worker ${name}`, {
      operation: 'WorkerManager',
      worker: name,
    });

    // Stop the worker
    await this.stopWorker(name);

    // Remove from workers map
    this.workers.delete(name);

    // Start new instance
    const config = {
      name,
      script: worker.script,
      instances: 1,
      env: worker.env || {},
    };

    return this.startWorker(name, config.script, config.env);
  }

  /**
   * Get worker status
   */
  getWorkerStatus(name = null) {
    if (name) {
      const worker = this.workers.get(name);
      return worker ? this.formatWorkerStatus(worker) : null;
    }

    const status = {};
    for (const [name, worker] of this.workers) {
      status[name] = this.formatWorkerStatus(worker);
    }
    return status;
  }

  /**
   * Get overall status
   */
  getStatus() {
    const workers = this.getWorkerStatus();
    const running = Object.values(workers).filter(w => w.status === WORKER_STATUS.RUNNING).length;
    const stopped = Object.values(workers).filter(w => w.status === WORKER_STATUS.STOPPED).length;
    const total = Object.keys(workers).length;

    return {
      total,
      running,
      stopped,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      workers,
    };
  }

  /**
   * Format worker status for reporting
   */
  formatWorkerStatus(worker) {
    return {
      name: worker.name,
      status: worker.status,
      pid: worker.process.pid,
      startTime: worker.startTime,
      uptime: worker.status === WORKER_STATUS.RUNNING ? Date.now() - worker.startTime.getTime() : null,
      exitCode: worker.exitCode,
      exitSignal: worker.exitSignal,
      script: worker.script,
    };
  }

  /**
   * Health check for all workers
   */
  async healthCheck() {
    const issues = [];

    for (const [name, worker] of this.workers) {
      try {
        // Check if process is still running
        if (worker.status === WORKER_STATUS.RUNNING) {
          const isRunning = !worker.process.killed && worker.process.exitCode === null;
          if (!isRunning) {
            issues.push({
              worker: name,
              issue: 'Process not running',
              status: worker.status,
            });
          }
        }

        // Check if process has been running too long without activity
        const uptime = Date.now() - worker.startTime.getTime();
        if (uptime > TIME_CONSTANTS.MS_PER_DAY) { // 24 hours
          issues.push({
            worker: name,
            issue: 'Worker running for extended period',
            uptime: uptime / 1000 / 60 / 60, // hours
          });
        }

      } catch (error) {
        issues.push({
          worker: name,
          issue: 'Health check failed',
          error: error.message,
        });
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Graceful shutdown handler
   */
  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}, initiating graceful shutdown`, {
      operation: 'WorkerManager',
    });

    await this.stopAllWorkers('SIGTERM', 15000);
    process.exit(0);
  }
}

// Create singleton instance
const workerManager = new WorkerManager();

// Handle process signals
process.on('SIGINT', () => workerManager.gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => workerManager.gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => workerManager.gracefulShutdown('SIGUSR2')); // Nodemon

module.exports = workerManager;

