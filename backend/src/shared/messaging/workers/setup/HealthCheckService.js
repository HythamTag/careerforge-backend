/**
 * HEALTH CHECK SERVICE
 *
 * Monitors worker health, queue backlogs, and system resources.
 * Provides health check endpoints and alerting capabilities.
 *
 * @module workers/setup/HealthCheckService
 */

const logger = require('@utils/logger');
const v8 = require('v8');

class HealthCheckService {
  /**
   * Create health check service.
   *
   * @param {Array<Object>} workers - Array of worker objects { worker, name }
   * @param {Object} connection - Redis connection
   */
  constructor(workers, connection) {
    this.workers = workers;
    this.connection = connection;
    this.checks = [];
  }

  /**
   * Run all health checks.
   *
   * @returns {Promise<Object>} Health check results
   */
  async runHealthChecks() {
    const results = {
      healthy: true,
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // Redis connection check
      results.checks.redis = await this.checkRedis();

      // Workers check
      results.checks.workers = await this.checkWorkers();

      // Queue backlogs check
      results.checks.backlogs = await this.checkBacklogs();

      // Memory usage check
      results.checks.memory = this.checkMemory();

      // Determine overall health
      results.healthy = Object.values(results.checks)
        .every(check => check.healthy !== false);

      if (!results.healthy) {
        logger.warn('Health check failed', {
          operation: 'HealthCheck',
          results,
        });
      }

      return results;

    } catch (error) {
      logger.error('Health check error', {
        operation: 'HealthCheck',
        error: error.message,
        stack: error.stack,
      });

      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Check Redis connection health.
   *
   * @returns {Promise<Object>} Redis health status
   */
  async checkRedis() {
    try {
      const startTime = Date.now();
      await this.connection.ping();
      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency: `${latency}ms`,
        status: this.connection.status || 'ready',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: this.connection.status || 'disconnected',
      };
    }
  }

  /**
   * Check worker health.
   *
   * @returns {Promise<Object>} Workers health status
   */
  async checkWorkers() {
    const workerStates = await Promise.all(
      this.workers.map(async ({ worker, name }) => {
        try {
          const isPaused = await worker.isPaused();
          const isRunning = await worker.isRunning();

          return {
            name,
            healthy: isRunning && !isPaused,
            paused: isPaused,
            running: isRunning,
          };
        } catch (error) {
          return {
            name,
            healthy: false,
            error: error.message,
          };
        }
      })
    );

    const allHealthy = workerStates.every(w => w.healthy);

    return {
      healthy: allHealthy,
      workers: workerStates,
      totalWorkers: workerStates.length,
      healthyWorkers: workerStates.filter(w => w.healthy).length,
    };
  }

  /**
   * Check queue backlogs.
   *
   * @returns {Promise<Object>} Backlogs health status
   */
  async checkBacklogs() {
    const backlogs = {};
    let healthy = true;
    const alerts = [];

    for (const { worker, name } of this.workers) {
      try {
        const queue = worker.queue;

        // Skip if queue not initialized yet
        if (!queue || typeof queue.getJobCounts !== 'function') {
          backlogs[name] = { status: 'initializing' };
          continue;
        }

        const counts = await queue.getJobCounts();

        backlogs[name] = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        };

        // Alert if backlog too large
        if (counts.waiting > 1000) {
          healthy = false;
          alerts.push(`${name}: waiting queue too large (${counts.waiting})`);
        }

        if (counts.delayed > 500) {
          healthy = false;
          alerts.push(`${name}: delayed queue too large (${counts.delayed})`);
        }

        if (counts.failed > 100) {
          alerts.push(`${name}: high failure count (${counts.failed})`);
        }

      } catch (error) {
        healthy = false;
        backlogs[name] = { error: error.message };
      }
    }

    const result = {
      healthy,
      backlogs,
    };

    if (alerts.length > 0) {
      result.alerts = alerts;
    }

    return result;
  }

  /**
   * Check memory usage.
   *
   * @returns {Object} Memory health status
   */
  checkMemory() {
    const usage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Calculate percentage based on total available heap limit, not current allocation
    const heapPercent = Math.round((usage.heapUsed / heapStats.heap_size_limit) * 100);

    // Only alert if we're using more than 85% of the absolute limit
    // OR if RSS is exceptionally high (> 2GB for a single worker)
    const MEMORY_THRESHOLD_PERCENT = 85;
    const RSS_THRESHOLD_MB = 2048;

    const healthy = heapPercent < MEMORY_THRESHOLD_PERCENT && rssMB < RSS_THRESHOLD_MB;

    if (!healthy) {
      logger.warn('High memory usage detected', {
        operation: 'HealthCheck',
        heapPercent,
        heapUsedMB,
        heapLimitMB,
        rssMB,
        message: heapPercent >= MEMORY_THRESHOLD_PERCENT ?
          `Heap usage (${heapPercent}%) exceeded threshold (${MEMORY_THRESHOLD_PERCENT}%)` :
          `RSS (${rssMB}MB) exceeded threshold (${RSS_THRESHOLD_MB}MB)`
      });
    }

    return {
      healthy,
      heapUsedMB,
      heapTotalMB,
      heapLimitMB,
      heapPercent,
      rssMB,
      threshold: MEMORY_THRESHOLD_PERCENT,
    };
  }

  /**
   * Get metrics summary.
   *
   * @returns {Promise<Object>} Metrics summary
   */
  async getMetricsSummary() {
    const health = await this.runHealthChecks();

    return {
      healthy: health.healthy,
      timestamp: health.timestamp,
      workers: {
        total: health.checks.workers?.totalWorkers || 0,
        healthy: health.checks.workers?.healthyWorkers || 0,
      },
      queues: Object.keys(health.checks.backlogs?.backlogs || {}).length,
      memory: {
        heapPercent: health.checks.memory?.heapPercent || 0,
        heapUsedMB: health.checks.memory?.heapUsedMB || 0,
      },
      redis: {
        healthy: health.checks.redis?.healthy || false,
        latency: health.checks.redis?.latency || 'N/A',
      },
    };
  }
}

module.exports = HealthCheckService;

