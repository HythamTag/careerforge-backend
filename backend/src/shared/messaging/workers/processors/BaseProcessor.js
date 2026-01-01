/**
 * BASE PROCESSOR
 *
 * Abstract base class for all job processors.
 * Provides common functionality: error handling, retry logic, metrics, and idempotency.
 *
 * @module workers/processors/BaseProcessor
 */

const { logger } = require('@utils');
const { JOB_STATUS, ERROR_CODES } = require('@constants');
const JobMetrics = require('../utils/JobMetrics');

class BaseProcessor {
  /**
   * Create base processor with dependency injection.
   *
   * @param {Object} dependencies - Injected dependencies
   * @param {Object} dependencies.jobService - Job service for status updates
   * @param {Object} [dependencies.logger] - Logger instance (optional)
   */
  constructor(dependencies) {
    this.validateDependencies(dependencies);
    this.jobService = dependencies.jobService;
    this.logger = dependencies.logger || logger;
    this.metrics = new JobMetrics(this.constructor.name);

    // Assign all other dependencies to this instance
    // This allows subclasses to access their dependencies via this.dependencyName
    Object.keys(dependencies).forEach(key => {
      if (key !== 'logger' && !this[key]) {
        this[key] = dependencies[key];
      }
    });
  }

  /**
   * Validate that all required dependencies are provided.
   *
   * @param {Object} dependencies - Dependencies to validate
   * @throws {Error} If required dependencies are missing
   */
  validateDependencies(dependencies) {
    const required = this.getRequiredDependencies();
    const missing = required.filter(dep => !dependencies[dep]);
    if (missing.length > 0) {
      throw new Error(`Missing dependencies for ${this.constructor.name}: ${missing.join(', ')}`);
    }
  }

  /**
   * Get list of required dependencies.
   * Override in subclasses to add more dependencies.
   *
   * @returns {Array<string>} Required dependency names
   */
  getRequiredDependencies() {
    return ['jobService'];
  }

  /**
   * Process a job - main entry point.
   * Handles common logic: status updates, error handling, metrics.
   *
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   */
  async process(job) {
    const startTime = Date.now();
    const { jobId, data } = this.extractJobData(job);

    this.logger.info(`Starting ${this.constructor.name}`, {
      operation: 'JobProcessing',
      processor: this.constructor.name,
      jobId,
      bullmqJobId: job.id,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts?.attempts || 3,
    });

    try {
      // Update job status to processing
      await this.jobService.updateJobStatus(jobId, JOB_STATUS.PROCESSING);

      // Execute the actual processing logic (implemented by subclasses)
      const result = await this.execute(jobId, data, job);
      this.logger.debug('Processor: Execution finished', { jobId });

      // Mark job as completed
      await this.jobService.completeJob(jobId, result);

      // Record success metrics
      const duration = Date.now() - startTime;
      this.metrics.recordSuccess(duration);

      this.logger.info(`Completed ${this.constructor.name}`, {
        operation: 'JobProcessing',
        jobType: job.name || job.data?.type,
        processor: this.constructor.name,
        jobId,
        userId: data.userId,
        duration,
        attempt: job.attemptsMade + 1,
        success: true,
        // Include business context from result if available
        ...(result && typeof result === 'object' ? {
          sectionsExtracted: result.sectionsExtracted,
          qualityScore: result.qualityScore,
          improvements: result.improvements,
          alreadyParsed: result.alreadyParsed,
          alreadyCompleted: result.alreadyCompleted,
        } : {}),
      });

      return result;

    } catch (error) {
      // Record failure metrics
      this.metrics.recordFailure();

      // Handle error (retry logic, final failure, etc.)
      await this.handleError(error, jobId, data, job);

      // Re-throw to let BullMQ handle retry
      throw error;
    }
  }

  /**
   * Extract job data from BullMQ job object.
   * Handles both { jobId, data } and direct data structures.
   *
   * @param {Object} job - BullMQ job object
   * @returns {Object} Extracted job data with jobId and data
   */
  extractJobData(job) {
    // Handle both { jobId, data } and direct data structures
    if (job.data.jobId && job.data.data) {
      return { jobId: job.data.jobId, data: job.data.data };
    }
    // Handle case where job.data is the data itself
    if (job.data.jobId) {
      return { jobId: job.data.jobId, data: job.data };
    }
    // Fallback: assume job.data contains jobId directly
    return { jobId: job.data.jobId || job.id, data: job.data };
  }

  /**
   * Handle errors during job processing.
   * Determines if error is retryable and handles final failures.
   *
   * @param {Error} error - Error that occurred
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   */
  async handleError(error, jobId, data, job) {
    const isRetryable = this.isRetryableError(error);
    const maxAttempts = job.opts?.attempts || 3;
    const willRetry = job.attemptsMade < maxAttempts - 1;

    this.logger.error(`${this.constructor.name} failed`, {
      operation: 'JobProcessing',
      processor: this.constructor.name,
      jobId,
      errorType: error.constructor.name,
      errorCode: error.code || error.errorCode,
      errorMessage: error.message,
      error: error, // Pass full error object for console formatter
      isRetryable,
      willRetry,
      attempt: job.attemptsMade + 1,
      maxAttempts,
      stack: error.stack,
    });

    // If this is the final attempt, mark job as failed
    if (!willRetry) {
      await this.jobService.failJob(jobId, {
        code: error.code || error.errorCode || ERROR_CODES.JOB_FAILED,
        message: error.message,
        details: {
          errorType: error.constructor.name,
          totalAttempts: job.attemptsMade + 1,
          isRetryable,
          ...(error.details || {}),
        },
      });

      // Call subclass hook for final failure handling
      await this.onFinalFailure(jobId, data, error);
    }
  }

  /**
   * Determine if an error is retryable.
   * Override in subclasses for custom retry logic.
   *
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    // Network errors, timeouts, rate limits are retryable
    const retryableCodes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'RATE_LIMIT',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
    ];

    // Check error code
    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }

    // Check error message for retryable patterns
    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'rate limit',
      'service unavailable',
      'temporary',
    ];

    const errorMessage = (error.message || '').toLowerCase();
    if (retryableMessages.some(pattern => errorMessage.includes(pattern))) {
      return true;
    }

    // Check if error has isRetryable property
    if (error.isRetryable === true) {
      return true;
    }

    // Validation errors and not found errors are not retryable
    if (error.code === ERROR_CODES.VALIDATION_ERROR || error.code === ERROR_CODES.NOT_FOUND) {
      return false;
    }

    // Default: assume retryable (let BullMQ retry mechanism decide)
    return true;
  }

  /**
   * Hook called when job fails after all retries exhausted.
   * Override in subclasses to handle final failures (e.g., update entity status, send notifications).
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Error} error - Final error
   */
  async onFinalFailure(jobId, data, error) {
    // Default implementation: just log
    this.logger.warn(`Final failure for ${this.constructor.name}`, {
      operation: 'JobProcessing',
      processor: this.constructor.name,
      jobId,
      error: error.message,
    });
  }

  /**
   * Execute the actual job processing logic.
   * Must be implemented by subclasses.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   * @throws {Error} If execution fails
   */
  async execute(jobId, data, job) {
    throw new Error(`${this.constructor.name}.execute() must be implemented by subclass`);
  }

  /**
   * Get processor metrics.
   *
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }
}

module.exports = BaseProcessor;

