/**
 * QUEUE SERVICE
 *
 * BullMQ-based queue service for background job processing.
 * Provides unified interface for adding jobs to different queues.
 *
 * @module messaging/queues/queue.service
 */

const { Queue } = require('bullmq');
const logger = require('@utils/logger');
const config = require('@config');
const { getRedisConnectionConfig } = require('@infrastructure/redis.connection');
const { NotFoundError } = require('@errors');
const { CLEANUP, NUMERIC_LIMITS, TIME_CONSTANTS, ERROR_CODES, JOB_STATUS } = require('@constants');

// Queue definitions loaded from centralized config (single source of truth)
// Access via config.jobQueue.queues

class QueueService {
  constructor() {
    this.queues = new Map();
    this.initialized = false;
  }

  /**
   * Initialize all queues
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    logger.info('Initializing queue service', { operation: 'QueueService' });

    try {
      const redisConfig = getRedisConnectionConfig();
      const connection = {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db || 0,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      };

      if (redisConfig.password) {
        connection.password = redisConfig.password;
      }

      const defaultJobOptions = {
        attempts: config.jobQueue.default.attempts,
        backoff: config.jobQueue.default.backoff,
        removeOnComplete: config.jobQueue.default.removeOnComplete,
        removeOnFail: config.jobQueue.default.removeOnFail,
      };

      // Create queues from centralized configuration (single source of truth)
      const queueDefinitions = config.jobQueue.queues;
      for (const [queueKey, queueDef] of Object.entries(queueDefinitions)) {
        const queue = new Queue(queueDef.name, {
          connection: connection,
          defaultJobOptions: defaultJobOptions,
        });

        this.queues.set(queueDef.name, queue);

        logger.info(`Queue ${queueDef.name} initialized`, {
          operation: 'QueueService',
          queueName: queueDef.name,
          concurrency: queueDef.concurrency,
          priority: queueDef.priority,
        });
      }

      this.initialized = true;
      logger.info('Queue service initialized successfully', {
        operation: 'QueueService',
        queueCount: this.queues.size,
      });

    } catch (error) {
      logger.error('Failed to initialize queue service', {
        operation: 'QueueService',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add job to queue
   */
  async add(queueName, data, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(`Queue ${queueName} not found`, ERROR_CODES.JOB_QUEUE_ERROR);
    }

    try {
      const defaultJobOptions = {
        attempts: config.jobQueue.default.attempts,
        backoff: config.jobQueue.default.backoff,
        removeOnComplete: config.jobQueue.default.removeOnComplete,
        removeOnFail: config.jobQueue.default.removeOnFail,
      };

      const job = await queue.add(queueName, data, {
        ...defaultJobOptions,
        ...options,
      });

      logger.info('Job added to queue', {
        operation: 'QueueService',
        queueName,
        jobId: job.id,
        dataKeys: Object.keys(data),
      });

      return job;
    } catch (error) {
      logger.error('Failed to add job to queue', {
        operation: 'QueueService',
        queueName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add job to queue with delay
   */
  async addDelayed(queueName, data, delayMs, options = {}) {
    return this.add(queueName, data, {
      ...options,
      delay: delayMs,
    });
  }

  /**
   * Add job to queue with priority
   */
  async addWithPriority(queueName, data, priority, options = {}) {
    return this.add(queueName, data, {
      ...options,
      priority,
    });
  }

  /**
   * Get queue instance
   */
  getQueue(queueName) {
    return this.queues.get(queueName);
  }

  /**
   * Get all queue names
   */
  getQueueNames() {
    return Array.from(this.queues.keys());
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName = null) {
    if (queueName) {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new NotFoundError(`Queue ${queueName} not found`, ERROR_CODES.JOB_QUEUE_ERROR);
      }

      const stats = await queue.getJobCounts();
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      return {
        queueName,
        stats,
        sampleJobs: {
          waiting: waiting.slice(0, 5).map(job => ({
            id: job.id,
            data: job.data,
            opts: job.opts,
          })),
          active: active.slice(0, 5).map(job => ({
            id: job.id,
            data: job.data,
            opts: job.opts,
          })),
          failed: failed.slice(0, 5).map(job => ({
            id: job.id,
            data: job.data,
            opts: job.opts,
            failedReason: job.failedReason,
          })),
        },
      };
    }

    // Get stats for all queues
    const allStats = {};
    for (const [name, queue] of this.queues) {
      try {
        allStats[name] = await this.getQueueStats(name);
      } catch (error) {
        logger.error(`Failed to get stats for queue ${name}`, {
          operation: 'QueueService',
          error: error.message,
        });
        allStats[name] = { error: error.message };
      }
    }

    return allStats;
  }

  /**
   * Clean up old jobs from queue
   */
  async cleanQueue(queueName, grace = CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD * TIME_CONSTANTS.MS_PER_DAY, limit = NUMERIC_LIMITS.LIMIT_MAX * 10) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(`Queue ${queueName} not found`, ERROR_CODES.JOB_QUEUE_ERROR);
    }

    const cleaned = await queue.clean(grace, limit, JOB_STATUS.COMPLETED);
    const cleanedFailed = await queue.clean(grace, limit, JOB_STATUS.FAILED);

    logger.info(`Cleaned queue ${queueName}`, {
      operation: 'QueueService',
      completed: cleaned.length,
      failed: cleanedFailed.length,
    });

    return {
      completed: cleaned.length,
      failed: cleanedFailed.length,
    };
  }

  /**
   * Clean up all queues
   */
  async cleanAllQueues(grace = CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD * TIME_CONSTANTS.MS_PER_DAY, limit = NUMERIC_LIMITS.LIMIT_MAX * 10) {
    const results = {};

    for (const queueName of this.queues.keys()) {
      try {
        results[queueName] = await this.cleanQueue(queueName, grace, limit);
      } catch (error) {
        logger.error(`Failed to clean queue ${queueName}`, {
          operation: 'QueueService',
          error: error.message,
        });
        results[queueName] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(`Queue ${queueName} not found`, ERROR_CODES.JOB_QUEUE_ERROR);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`, { operation: 'QueueService' });
  }

  /**
   * Unpause a paused queue
   */
  async unpauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new NotFoundError(`Queue ${queueName} not found`, ERROR_CODES.JOB_QUEUE_ERROR);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} unpaused`, { operation: 'QueueService' });
  }

  /**
   * Close all queues
   */
  async close() {
    logger.info('Closing all queues', { operation: 'QueueService' });

    const closePromises = [];
    for (const [name, queue] of this.queues) {
      closePromises.push(
        queue.close().catch(error => {
          logger.error(`Error closing queue ${name}`, {
            operation: 'QueueService',
            error: error.message,
          });
        }),
      );
    }

    await Promise.allSettled(closePromises);
    this.queues.clear();
    this.initialized = false;

    logger.info('All queues closed', { operation: 'QueueService' });
  }

  /**
   * Health check for queues
   */
  async healthCheck() {
    const issues = [];

    for (const [name, queue] of this.queues) {
      try {
        // Try to get basic queue info
        await queue.getJobCounts();

        // Check Redis connection
        const client = await queue.client;
        if (!client || client.status !== 'ready') {
          issues.push({
            queue: name,
            issue: 'Redis connection not ready',
            status: client?.status,
          });
        }

      } catch (error) {
        issues.push({
          queue: name,
          issue: 'Queue health check failed',
          error: error.message,
        });
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
      queueCount: this.queues.size,
    };
  }
}

module.exports = QueueService;

