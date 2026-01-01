/**
 * JOB QUEUE CONFIGURATION
 *
 * BullMQ job queue configuration.
 * Single source of truth for all queue definitions and settings.
 * 
 * NOTE: This file does NOT import from @constants to avoid circular dependencies.
 * Job type strings are defined here directly to maintain independence.
 */

/**
 * Job type constants (local to avoid @constants dependency)
 * These must match the values in @constants/job.constants.js
 */
const JOB_TYPE = Object.freeze({
  CV_PARSING: 'cv_parsing',
  CV_OPTIMIZATION: 'cv_optimization',
  CV_GENERATION: 'cv_generation',
  CV_ENHANCEMENT: 'cv_enhancement',
  ATS_ANALYSIS: 'ats_analysis',
  WEBHOOK_DELIVERY: 'webhook_delivery',
  EMAIL_NOTIFICATION: 'email_notification',
  DOCUMENT_EXPORT: 'document_export',
});

/**
 * Job retry strategy constants (local to avoid @constants dependency)
 * These must match the values in @constants/job.constants.js
 */
const JOB_RETRY_STRATEGY = Object.freeze({
  EXPONENTIAL: 'exponential',
  LINEAR: 'linear',
  FIXED: 'fixed',
});

class QueueConfig {
  static getConfig(env) {
    return {
      default: {
        attempts: env.JOB_MAX_ATTEMPTS,
        backoff: {
          type: JOB_RETRY_STRATEGY.EXPONENTIAL,
          delay: env.JOB_BACKOFF_DELAY,
        },
        limiter: {
          max: env.JOB_LIMITER_MAX,
          duration: env.JOB_LIMITER_DURATION,
        },
        removeOnComplete: {
          age: env.JOB_REMOVE_ON_COMPLETE_AGE,
          count: env.JOB_REMOVE_ON_COMPLETE_COUNT,
        },
        removeOnFail: {
          age: env.JOB_REMOVE_ON_FAIL_AGE,
        },
      },
      queues: {
        [JOB_TYPE.CV_PARSING]: {
          name: JOB_TYPE.CV_PARSING,
          concurrency: env.JOB_QUEUE_PARSING_CONCURRENCY,
          priority: env.JOB_QUEUE_PARSING_PRIORITY,
        },
        [JOB_TYPE.CV_OPTIMIZATION]: {
          name: JOB_TYPE.CV_OPTIMIZATION,
          concurrency: env.JOB_QUEUE_ENHANCEMENT_CONCURRENCY,
          priority: env.JOB_QUEUE_ENHANCEMENT_PRIORITY,
        },
        [JOB_TYPE.CV_GENERATION]: {
          name: JOB_TYPE.CV_GENERATION,
          concurrency: env.JOB_QUEUE_GENERATION_CONCURRENCY,
          priority: env.JOB_QUEUE_GENERATION_PRIORITY,
        },
        [JOB_TYPE.ATS_ANALYSIS]: {
          name: JOB_TYPE.ATS_ANALYSIS,
          concurrency: env.JOB_QUEUE_ENHANCEMENT_CONCURRENCY,
          priority: env.JOB_QUEUE_ENHANCEMENT_PRIORITY,
        },
        [JOB_TYPE.WEBHOOK_DELIVERY]: {
          name: JOB_TYPE.WEBHOOK_DELIVERY,
          concurrency: env.JOB_QUEUE_WEBHOOK_DELIVERY_CONCURRENCY,
          priority: env.JOB_QUEUE_WEBHOOK_DELIVERY_PRIORITY,
        },
      },
    };
  }
}

module.exports = QueueConfig;
