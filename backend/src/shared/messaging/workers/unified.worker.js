/**
 * UNIFIED WORKER
 *
 * Comprehensive background worker for processing all job types using BullMQ.
 * Handles parsing, ATS analysis, generation, and webhook delivery jobs.
 *
 * @module workers/unified.worker
 */

// Environment variables are loaded by @config (env-loader.js) - single source of truth
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { connectRedis, getRedisConnectionConfig } = require('@infrastructure/redis.connection');
const connectDatabase = require('@infrastructure/database.connection');
const logger = require('@utils/logger');
const config = require('@config');

// DI Container
const { getContainer } = require('@core/container');
const { JOB_TYPE } = require('@constants');

// Job processors
const ParsingJobProcessor = require('./processors/ParsingJobProcessor');
const GenerationJobProcessor = require('./processors/GenerationJobProcessor');
const WebhookDeliveryProcessor = require('./processors/WebhookDeliveryProcessor');
// Added ATS Processor
const ATSJobProcessor = require('./processors/ATSJobProcessor');

// Pre-load models required for populate operations across all processors
require('@modules/users/models/user.model');

// Worker event handler
const { setupWorkerEvents } = require('./setup/WorkerEventHandler');
const HealthCheckService = require('./setup/HealthCheckService');

// ============================================================================
// DEPENDENCY SETUP
// ============================================================================

/**
 * Create processor instances using DI container.
 */
function createProcessors() {
  const container = getContainer();

  const parsingProcessor = new ParsingJobProcessor({
    jobService: container.resolve('jobService'),
    cvRepository: container.resolve('cvRepository'),
    fileService: container.resolve('fileService'),
    pdfService: container.resolve('pdfService'),
    textCleanerService: container.resolve('textCleanerService'),
    cvParsingService: container.resolve('cvParsingService'),
  });

  const atsProcessor = new ATSJobProcessor({
    jobService: container.resolve('jobService'),
    atsRepository: container.resolve('cvAtsRepository'),
    cvAtsService: container.resolve('cvAtsService'),
    cvAtsAnalysisService: container.resolve('cvAtsAnalysisService'),
  });

  const generationProcessor = new GenerationJobProcessor({
    jobService: container.resolve('jobService'),
    generationRepository: container.resolve('generationRepository'),
    generationService: container.resolve('generationService'),
  });

  const webhookProcessor = new WebhookDeliveryProcessor({
    jobService: container.resolve('jobService'),
    webhookRepository: container.resolve('webhookRepository'),
    webhookService: container.resolve('webhookService'),
  });

  return {
    parsingProcessor,
    atsProcessor,
    generationProcessor,
    webhookProcessor,
  };
}

// ============================================================================
// WORKER SETUP
// ============================================================================

async function startWorker() {
  logger.info('Starting Unified Worker', { operation: 'Worker startup' });

  try {
    // Connect to databases
    await connectRedis();
    await connectDatabase();

    logger.info('Connected to Redis and MongoDB', { operation: 'Worker startup' });

    // Create processors using DI container
    const processors = createProcessors();

    // Get Redis connection config
    const redisConfig = getRedisConnectionConfig();
    const connection = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    await connection.connect();

    // Worker configurations - using centralized config (single source of truth)
    const queueConfig = config.jobQueue;

    // Parse command line arguments for queue filtering
    // Format: --queues=cv_parsing,ats_analysis
    const args = process.argv.slice(2);
    const queuesArg = args.find(arg => arg.startsWith('--queues='));
    const allowedQueues = queuesArg ? queuesArg.split('=')[1].split(',') : null;

    if (allowedQueues) {
      logger.info('Running in specific queue mode', {
        operation: 'Worker startup',
        allowedQueues,
      });
    }

    const workerConfigs = [
      {
        name: 'cv_parsing',
        queueName: queueConfig.queues[JOB_TYPE.CV_PARSING].name,
        processor: processors.parsingProcessor,
        concurrency: queueConfig.queues[JOB_TYPE.CV_PARSING].concurrency,
      },
      {
        name: 'ats_analysis',
        queueName: queueConfig.queues[JOB_TYPE.ATS_ANALYSIS].name,
        processor: processors.atsProcessor, // Use dedicated ATS processor
        concurrency: queueConfig.queues[JOB_TYPE.ATS_ANALYSIS].concurrency,
      },
      {
        name: 'cv_generation',
        queueName: queueConfig.queues[JOB_TYPE.CV_GENERATION].name,
        processor: processors.generationProcessor,
        concurrency: queueConfig.queues[JOB_TYPE.CV_GENERATION].concurrency,
      },
      {
        name: 'webhook_delivery',
        queueName: queueConfig.queues[JOB_TYPE.WEBHOOK_DELIVERY].name,
        processor: processors.webhookProcessor,
        concurrency: queueConfig.queues[JOB_TYPE.WEBHOOK_DELIVERY].concurrency,
      },
    ].filter(config => {
      // If no queues specified, run all
      if (!allowedQueues) return true;
      // Otherwise, check if queue name or worker name is in the allowed list
      return allowedQueues.some(q =>
        config.name === q ||
        config.queueName === q
      );
    });

    if (workerConfigs.length === 0) {
      logger.warn('No workers matched the specified filter', {
        operation: 'Worker startup',
        allowedQueues,
      });
      process.exit(0);
    }

    // Create and start workers
    const workers = [];

    for (const workerConfig of workerConfigs) {
      const worker = new Worker(
        workerConfig.queueName,
        async (job) => {
          // Job wrapper with consistent error handling
          try {
            return await workerConfig.processor.process(job);
          } catch (error) {
            // Mark error as logged so event handler doesn't duplicate
            error._alreadyLogged = true;
            throw error;
          }
        },
        {
          connection,
          concurrency: workerConfig.concurrency,
          limiter: queueConfig.default.limiter,
          // CRITICAL: lockDuration must be > AI timeout to prevent stalling
          lockDuration: 300000, // 5 minutes
          settings: {
            stalledInterval: 60000, // Check for stalled jobs every 60s
            maxStalledCount: 3, // Allow more stalls for heavy GPU tasks
          },
          removeOnComplete: queueConfig.default.removeOnComplete,
          removeOnFail: queueConfig.default.removeOnFail,
        },
      );

      // Setup event handlers
      setupWorkerEvents(worker, workerConfig.name);

      workers.push({ worker, name: workerConfig.name });

      logger.info(`${workerConfig.name} worker started`, {
        operation: 'Worker startup',
        queueName: workerConfig.queueName,
        concurrency: workerConfig.concurrency,
      });
    }

    // Health monitoring
    const healthCheckService = new HealthCheckService(workers, connection);
    let healthCheckInterval = null;

    if (config.monitoring?.healthCheck?.enabled !== false) {
      const interval = config.monitoring?.healthCheck?.interval || 60000; // Default 1 minute
      healthCheckInterval = setInterval(async () => {
        try {
          const health = await healthCheckService.runHealthChecks();
          if (!health.healthy) {
            logger.warn('Health check detected issues', {
              operation: 'HealthCheck',
              health,
            });
          } else {
            logger.debug('Health check passed', {
              operation: 'HealthCheck',
              summary: await healthCheckService.getMetricsSummary(),
            });
          }
        } catch (error) {
          logger.error('Health check error', {
            operation: 'HealthCheck',
            error: error.message,
            stack: error.stack,
          });
        }
      }, interval);
    }

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down workers gracefully`, {
        operation: 'Worker shutdown',
        signal,
      });

      // Stop health checks
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }

      // Close all workers (with timeout)
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Worker shutdown timeout, forcing exit', {
          operation: 'Worker shutdown',
        });
        process.exit(1);
      }, 30000); // 30 second timeout

      try {
        // Close all workers
        await Promise.allSettled(
          workers.map(({ worker }) => worker.close())
        );

        // Close Redis connection
        await connection.quit();

        clearTimeout(shutdownTimeout);

        logger.info('All workers shut down gracefully', {
          operation: 'Worker shutdown',
        });

        process.exit(0);
      } catch (error) {
        clearTimeout(shutdownTimeout);
        logger.error('Error during shutdown', {
          operation: 'Worker shutdown',
          error: error.message,
          stack: error.stack,
        });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.logError(error, { operation: 'Uncaught exception' });
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        operation: 'Unhandled rejection',
        reason: reason,
        promise: promise,
      });
      shutdown('unhandledRejection');
    });

    logger.info('Unified Worker ready and waiting for jobs', {
      operation: 'Worker startup',
      queues: workerConfigs.map(c => c.queueName),
      totalConcurrency: workerConfigs.reduce((sum, c) => sum + c.concurrency, 0),
    });

  } catch (error) {
    logger.logError(error, { operation: 'Worker startup' });
    process.exit(1);
  }
}

// Start worker
startWorker();

