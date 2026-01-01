/**
 * JOB SERVICE - Best Practices Implementation
 *
 * Follows SOLID principles, separation of concerns, and enterprise patterns.
 *
 * @module modules/jobs/services/job.service
 */

const { EventEmitter } = require('events');
const { JOB_STATUS, JOB_PRIORITY, JOB_LIMITS, JOB_EVENTS, NUMERIC_LIMITS, ERROR_CODES, RESPONSE_MESSAGES, CLEANUP, HTTP_STATUS } = require('@constants');
const config = require('@config');
const { AppError } = require('@errors');
const JobValidator = require('../validators/job.business.validator');
const JobIdGenerator = require('./job-id.generator');
const TransactionManager = require('@infrastructure/transaction.manager');

// Local defaults mapped to global constants (single source of truth)
const DEFAULTS = {
  MAX_RETRIES: JOB_LIMITS.DEFAULT_RETRIES,
  MAX_LIMIT: NUMERIC_LIMITS.LIMIT_MAX,
  DEFAULT_LIMIT: NUMERIC_LIMITS.DEFAULT_LIMIT,
  MAX_RETRY_LIMIT: JOB_LIMITS.MAX_RETRIES,
  DEFAULT_DELAY_MS: NUMERIC_LIMITS.DEFAULT_COUNT, // No delay by default
  INITIAL_RETRY_COUNT: NUMERIC_LIMITS.DEFAULT_COUNT, // Initial retry count
  CLEANUP_MIN_DAYS: CLEANUP.MIN_CLEANUP_DAYS, // Minimum days for cleanup validation
  DEFAULT_CLEANUP_DAYS: CLEANUP.JOB_CLEANUP_DAYS_OLD, // Default cleanup days for jobs
};

// JOB_EVENTS imported from @constants

/**
 * Custom error classes - extend AppError for consistency
 */
class JobServiceError extends AppError {
  constructor(message, code, details = {}) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    this.name = 'JobServiceError';
    this.details = details;
  }
}

class JobNotFoundError extends AppError {
  constructor(jobId) {
    super(`Job ${jobId} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.JOB_NOT_FOUND);
    this.name = 'JobNotFoundError';
    this.jobId = jobId;
  }
}

class InvalidJobStateError extends AppError {
  constructor(message, currentState, attemptedState) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.JOB_INVALID_STATE);
    this.name = 'InvalidJobStateError';
    this.currentState = currentState;
    this.attemptedState = attemptedState;
  }
}

/**
 * Job Service - Core business logic for job management
 */
class JobService extends EventEmitter {
  /**
     * @param {Object} dependencies - Injected dependencies
     * @param {Object} dependencies.jobRepository - Job data access layer
     * @param {Object} dependencies.queueService - Queue management service
     * @param {Object} dependencies.logger - Logging service
     * @param {Object} dependencies.validator - Job validator (optional)
     * @param {Object} dependencies.idGenerator - ID generator (optional)
     * @param {Object} dependencies.config - Service configuration
     */
  constructor(dependencies) {
    super();

    this._validateDependencies(dependencies);

    this.jobRepository = dependencies.jobRepository;
    this.queueService = dependencies.queueService;
    this.logger = dependencies.logger;
    this.validator = dependencies.validator ? dependencies.validator : new JobValidator();
    this.idGenerator = dependencies.idGenerator ? dependencies.idGenerator : new JobIdGenerator();
    this.config = {
      maxRetries: DEFAULTS.MAX_RETRIES,
      maxLimit: DEFAULTS.MAX_LIMIT,
      defaultLimit: DEFAULTS.DEFAULT_LIMIT,
      ...dependencies.config,
    };

    // State machine for valid transitions
    this.validTransitions = this._buildStateTransitionMap();
  }

  /**
     * Validate required dependencies
     * @private
     */
  _validateDependencies(deps) {
    if (!deps || typeof deps !== 'object') {
      throw new JobServiceError('Dependencies object is required', ERROR_CODES.JOB_INVALID_DEPS);
    }

    const required = ['jobRepository', 'logger'];
    for (const dep of required) {
      if (!deps[dep]) {
        throw new JobServiceError(`${dep} is required`, ERROR_CODES.JOB_MISSING_DEPENDENCY);
      }
    }
  }

  /**
     * Build state transition map
     * @private
     */
  _buildStateTransitionMap() {
    return {
      [JOB_STATUS.PENDING]: [JOB_STATUS.QUEUED, JOB_STATUS.CANCELLED],
      [JOB_STATUS.QUEUED]: [JOB_STATUS.PROCESSING, JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
      [JOB_STATUS.PROCESSING]: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
      [JOB_STATUS.FAILED]: [JOB_STATUS.PROCESSING, JOB_STATUS.RETRYING, JOB_STATUS.CANCELLED], // Allow retry
      [JOB_STATUS.RETRYING]: [JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
      [JOB_STATUS.COMPLETED]: [],
      [JOB_STATUS.CANCELLED]: [],
    };
  }

  /**
     * Create a new job
     * @public
     */
  async createJob(type, data, options = {}) {
    // Validate inputs
    this.validator.validateJobType(type);
    this.validator.validateJobData(data);
    this.validator.validateJobOptions(options);

    const {
      userId = null,
      priority = JOB_PRIORITY.NORMAL,
      maxRetries = this.config.maxRetries,
      relatedEntityId = null,
      tags = [],
      metadata = {},
      delay = DEFAULTS.DEFAULT_DELAY_MS,
      session = null, // Extract session
      ...storedOptions // Remaining options to store
    } = options;

    // Use an existing jobId from options or data if provided, otherwise generate a new one
    const jobId = options.jobId || data.jobId || this.idGenerator.generate(type, userId);

    const jobData = {
      jobId,
      type,
      data,
      options: {
        priority,
        maxRetries,
        delay,
        ...storedOptions, // Store only serializable options
      },
      priority,
      maxRetries,
      userId,
      relatedEntityId,
      tags: Array.isArray(tags) ? tags : [],
      metadata: metadata,
      status: JOB_STATUS.PENDING,
      retryCount: DEFAULTS.INITIAL_RETRY_COUNT,
    };

    try {
      // Step 1: Create the job in the database
      // If an external session is provided, use it. Otherwise, use a local transaction if needed.
      const executeOp = async (currentSession) => {
        return await this.jobRepository.create(jobData, { session: currentSession });
      };

      const job = session
        ? await executeOp(session)
        : await TransactionManager.executeAtomic((sess) => executeOp(sess));

      // Step 2: Queue the job AFTER the creation transaction has committed
      // Note: If an external session was provided, we skip automatic enqueuing 
      // because the transaction hasn't necessarily committed yet.
      // The caller is responsible for calling enqueueJob() after commit.
      try {
        if (this.queueService && !session) {
          await this.enqueueJob(job);
        } else if (!this.queueService && !session) {
          // Fallback if no queue service and no session
          await this.jobRepository.updateStatus(job.jobId, JOB_STATUS.QUEUED);
        }
      } catch (queueError) {
        // Log error but don't fail the whole request since job is already in DB
        // (A background process could re-enqueue failed PENDING jobs)
        this.logger.error('Job created but failed to enqueue', {
          jobId: job.jobId,
          error: queueError.message,
        });
      }

      this.emit(JOB_EVENTS.CREATED, job);
      this.logger.info('Job created successfully', {
        jobId: job.jobId,
        type: job.type,
        userId: job.userId,
      });

      return job;
    } catch (error) {
      this.logger.error('Failed to create job', {
        type,
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new JobServiceError(
        'Failed to create job',
        ERROR_CODES.JOB_CREATION_FAILED,
        { type, userId, originalError: error.message },
      );
    }
  }

  /**
     * Enqueue job for processing
     * @public
     */
  async enqueueJob(job, session = null) {
    if (!this.queueService) {
      throw new JobServiceError('Queue service not available', ERROR_CODES.JOB_NO_QUEUE_SERVICE);
    }

    try {
      // Step 1: Update status to QUEUED in DB first
      // This ensures that even if the worker picks it up instantly, the status is valid
      // and won't be overwritten by a delayed update from this function
      try {
        await this.jobRepository.updateStatus(job.jobId, JOB_STATUS.QUEUED, {}, { session });
      } catch (dbError) {
        this.logger.error('Failed to update job status to QUEUED', { jobId: job.jobId, error: dbError.message });
        throw dbError;
      }

      // Step 2: Add to BullMQ
      const queueConfig = config.jobQueue.default;

      await this.queueService.add(job.type, {
        jobId: job.jobId,
        data: job.data,
        options: job.options,
      }, {
        jobId: job.jobId,
        priority: this._mapPriority(job.priority),
        delay: job.options.delay,
        attempts: job.maxRetries + 1,
        backoff: {
          type: queueConfig.backoff.type,
          delay: queueConfig.backoff.delay,
        },
        removeOnComplete: queueConfig.removeOnComplete.count,
        removeOnFail: {
          age: queueConfig.removeOnFail.age,
        },
      });

      this.emit(JOB_EVENTS.QUEUED, job);
      this.logger.debug('Job enqueued', { jobId: job.jobId, type: job.type });
    } catch (error) {
      this.logger.error('Failed to enqueue job', {
        jobId: job.jobId,
        error: error.message,
      });

      // Mark job as failed if queueing fails
      await this.jobRepository.updateStatus(job.jobId, JOB_STATUS.FAILED, {
        error: {
          message: 'Failed to enqueue job',
          details: error.message,
          timestamp: new Date(),
        },
      }, { session });

      throw error;
    }
  }

  _mapPriority(priority) {
    // Map JOB_PRIORITY constants to queue priority values (using constants as single source of truth)
    // The numeric values are the same as JOB_PRIORITY constants, so we use them directly
    const priorityMapping = {
      [JOB_PRIORITY.LOW]: JOB_PRIORITY.LOW,
      [JOB_PRIORITY.NORMAL]: JOB_PRIORITY.NORMAL,
      [JOB_PRIORITY.HIGH]: JOB_PRIORITY.HIGH,
      [JOB_PRIORITY.URGENT]: JOB_PRIORITY.URGENT,
    };
    return priorityMapping[priority] ?? JOB_PRIORITY.NORMAL;
  }

  /**
     * Get job by ID
     * @public
     */
  async getJob(jobId) {
    this.validator.validateJobId(jobId);

    let job = await this.jobRepository.findById(jobId);

    // Add a tiny retry if not found, to handle potential DB synchronization delay 
    // especially right after a transaction commit
    if (!job) {
      this.logger.debug('Job not found in DB, waiting before retry', { jobId });
      await new Promise(resolve => setTimeout(resolve, 500));
      job = await this.jobRepository.findById(jobId);
    }

    if (!job) {
      this.logger.error('Job not found after retry', { jobId });
      throw new JobNotFoundError(jobId);
    }

    this.logger.debug('Job fetched from DB', { jobId, status: job.status });
    return job;
  }

  /**
     * Get job by ID (returns null if not found)
     * @public
     */
  async findJobById(jobId) {
    if (!jobId) { return null; }
    return await this.jobRepository.findById(jobId);
  }

  /**
     * Get jobs for user with pagination
     * @public
     */
  async getUserJobs(userId, filters = {}) {
    this.validator.validateUserId(userId);

    const options = {
      sort: filters.sort,
      limit: this._normalizeLimit(filters.limit),
      skip: filters.skip !== undefined ? Math.max(filters.skip, NUMERIC_LIMITS.DEFAULT_COUNT) : NUMERIC_LIMITS.DEFAULT_COUNT,
      populate: Array.isArray(filters.populate) ? filters.populate : [],
    };

    return await this.jobRepository.findByUserId(userId, options);
  }

  /**
     * Update job status with state validation
     * @public
     */
  async updateJobStatus(jobId, newStatus, additionalData = {}) {
    this.logger.debug('Updating job status', { jobId, targetStatus: newStatus });
    const job = await this.getJob(jobId);

    // Allow same-state "transitions" as no-op (handles retries gracefully)
    if (job.status === newStatus) {
      this.logger.debug('Job already in target status, skipping update', {
        jobId,
        status: newStatus,
      });
      return job;
    }

    // Ignore "late" updates if job is already finished (COMPLETED or CANCELLED)
    // FAILED is not included here because we might want to move it to PROCESSING for a retry
    if ([JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED].includes(job.status)) {
      this.logger.debug('Job already finished, ignoring late status update', {
        jobId,
        currentStatus: job.status,
        skippedStatus: newStatus
      });
      return job;
    }

    if (!this._isValidTransition(job.status, newStatus)) {
      this.logger.error('Invalid status transition attempted', {
        jobId,
        currentStatus: job.status,
        targetStatus: newStatus,
        allowed: this.validTransitions[job.status]
      });
      throw new InvalidJobStateError(
        `Invalid transition from ${job.status} to ${newStatus}`,
        job.status,
        newStatus,
      );
    }

    const updatedJob = await this.jobRepository.updateStatus(jobId, newStatus, additionalData);

    if (updatedJob) {
      this.logger.info('Job status updated successfully', {
        jobId,
        oldStatus: job.status,
        newStatus: updatedJob.status
      });
    } else {
      this.logger.error('Failed to update job status - repository returned null', { jobId, targetStatus: newStatus });
    }

    // Emit appropriate event
    const eventMap = {
      [JOB_STATUS.PROCESSING]: JOB_EVENTS.STARTED,
      [JOB_STATUS.COMPLETED]: JOB_EVENTS.COMPLETED,
      [JOB_STATUS.FAILED]: JOB_EVENTS.FAILED,
      [JOB_STATUS.CANCELLED]: JOB_EVENTS.CANCELLED,
      [JOB_STATUS.RETRYING]: JOB_EVENTS.RETRYING,
    };

    if (eventMap[newStatus]) {
      this.emit(eventMap[newStatus], updatedJob);
    }

    return updatedJob;
  }

  /**
     * Check if status transition is valid
     * @private
     */
  _isValidTransition(currentStatus, newStatus) {
    return this.validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
     * Update job progress
     * @public
     */
  async updateJobProgress(jobId, progress, currentStep = null, totalSteps = null) {
    this.validator.validateProgress(progress, currentStep, totalSteps);

    const updatedJob = await this.jobRepository.updateProgress(
      jobId,
      progress,
      currentStep,
      totalSteps,
    );

    this.emit(JOB_EVENTS.PROGRESS, {
      jobId,
      progress,
      currentStep,
      totalSteps,
    });

    return updatedJob;
  }

  /**
     * Mark job as completed
     * @public
     */
  async completeJob(jobId, result = null) {
    this.logger.debug('Completing job', { jobId });

    // Centralized transition via updateJobStatus
    // This handles validation, persistence, and event emission
    return await this.updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
      result,
      error: null // Clear any previous error
    });
  }

  /**
     * Mark job as failed
     * @public
     */
  async failJob(jobId, error = null) {
    const errorData = this._normalizeError(error);
    this.logger.debug('Failing job', { jobId, error: errorData?.message });

    // Centralized transition via updateJobStatus
    return await this.updateJobStatus(jobId, JOB_STATUS.FAILED, {
      error: errorData
    });
  }

  /**
     * Normalize error object
     * @private
     */
  _normalizeError(error) {
    if (!error) { return null; }

    if (typeof error === 'string') {
      return { message: error, timestamp: new Date() };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        code: error.code ? error.code : ERROR_CODES.UNKNOWN_ERROR,
        stack: config.server.isDevelopment ? error.stack : undefined,
        timestamp: new Date(),
      };
    }

    return { ...error, timestamp: new Date() };
  }

  /**
     * Cancel job
     * @public
     */
  async cancelJob(jobId, reason = null) {
    const job = await this.getJob(jobId);
    const cancelReason = reason ?? RESPONSE_MESSAGES.JOB_CANCELLED;

    const cancellableStates = [JOB_STATUS.PENDING, JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING];
    if (!cancellableStates.includes(job.status)) {
      throw new InvalidJobStateError(
        `Cannot cancel job in status: ${job.status}`,
        job.status,
        JOB_STATUS.CANCELLED,
      );
    }

    // Remove from queue if applicable
    if (this.queueService && job.status === JOB_STATUS.QUEUED) {
      try {
        await this.queueService.remove(job.jobId);
      } catch (error) {
        this.logger.warn('Failed to remove job from queue', {
          jobId,
          error: error.message,
        });
      }
    }

    const cancelledJob = await this.jobRepository.updateStatus(
      jobId,
      JOB_STATUS.CANCELLED,
      { error: { message: cancelReason, timestamp: new Date() } },
    );

    this.emit(JOB_EVENTS.CANCELLED, { job: cancelledJob, reason: cancelReason });
    this.logger.info('Job cancelled', { jobId, type: job.type, reason: cancelReason });

    return cancelledJob;
  }

  /**
     * Retry failed job
     * @public
     */
  async retryJob(jobId) {
    const job = await this.getJob(jobId);

    // Validate retry eligibility
    const retryableStates = [JOB_STATUS.FAILED, JOB_STATUS.CANCELLED];
    if (!retryableStates.includes(job.status)) {
      throw new InvalidJobStateError(
        `Job ${jobId} is not in a retryable state`,
        job.status,
        JOB_STATUS.RETRYING,
      );
    }

    const currentRetryCount = job.retryCount;
    if (currentRetryCount >= job.maxRetries) {
      throw new JobServiceError(
        `Job ${jobId} has exceeded maximum retry attempts`,
        ERROR_CODES.JOB_MAX_RETRIES_EXCEEDED,
        { jobId, retryCount: currentRetryCount, maxRetries: job.maxRetries },
      );
    }

    // Schedule retry
    const retriedJob = await this.jobRepository.scheduleRetry(jobId);

    // Re-enqueue if queue service available
    if (this.queueService) {
      await this._enqueueJob(retriedJob);
    }

    this.emit(JOB_EVENTS.RETRYING, retriedJob);
    this.logger.info('Job scheduled for retry', {
      jobId,
      retryCount: currentRetryCount + 1,
      maxRetries: job.maxRetries,
    });

    return retriedJob;
  }

  /**
     * Process job result from worker
     * @public
     */
  async processJobResult(jobId, success, result = null, error = null) {
    this.validator.validateJobId(jobId);

    const job = await this.getJob(jobId);

    if (success) {
      return await this.completeJob(jobId, result);
    }

    // Attempt automatic retry if eligible
    const currentRetryCount = job.retryCount;

    if (currentRetryCount < job.maxRetries) {
      try {
        await this.retryJob(jobId);
        return {
          status: JOB_STATUS.RETRYING,
          retryCount: currentRetryCount + 1,
          maxRetries: job.maxRetries,
        };
      } catch (retryError) {
        this.logger.error('Auto-retry failed', {
          jobId,
          error: retryError.message,
        });
        return await this.failJob(jobId, error ? error : retryError);
      }
    }

    // Max retries exceeded
    return await this.failJob(jobId, error);
  }

  /**
     * Get detailed job statistics
     * Returns breakdown by status, type, success rate, and recent activity timeline.
     * @public
     */
  async getJobStats(userId = null) {
    // 1. Base query filter
    const filter = {};
    if (userId) {
      filter.userId = userId;
    }

    // 2. Fetch raw counts via aggregation for performance
    const [statusStats, typeStats, timelineStats, totalCount] = await Promise.all([
      // Count by status
      this.jobRepository.model.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Count by type
      this.jobRepository.model.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      // Timeline (Last 7 days)
      this.jobRepository.model.aggregate([
        {
          $match: {
            ...filter,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Total count
      this.jobRepository.count(filter)
    ]);

    // 3. Transform aggregation results into clean objects
    const summary = {
      total: totalCount,
      completed: 0,
      failed: 0,
      processing: 0,
      pending: 0,
      cancelled: 0
    };

    statusStats.forEach(stat => {
      if (summary.hasOwnProperty(stat._id)) {
        summary[stat._id] = stat.count;
      }
    });

    const byType = {};
    typeStats.forEach(stat => {
      byType[stat._id] = stat.count;
    });

    const recentActivity = timelineStats.map(stat => ({
      date: stat._id,
      count: stat.count
    }));

    // 4. Calculate Success Rate
    const finishedJobs = summary.completed + summary.failed;
    const successRate = finishedJobs > 0
      ? parseFloat(((summary.completed / finishedJobs) * 100).toFixed(1))
      : 0;

    return {
      summary,
      byType,
      successRate,
      recentActivity
    };
  }

  /**
     * Get active jobs count
     * @public
     */
  async getActiveJobsCount(userId = null) {
    const query = {
      status: {
        $in: [
          JOB_STATUS.PENDING,
          JOB_STATUS.QUEUED,
          JOB_STATUS.PROCESSING,
          JOB_STATUS.RETRYING,
        ],
      },
    };

    if (userId) { query.userId = userId; }

    return await this.jobRepository.count(query);
  }


  /**
     * Clean up old completed jobs
     * @public
     */
  async cleanupOldJobs(olderThanDays = DEFAULTS.DEFAULT_CLEANUP_DAYS) {
    if (olderThanDays < DEFAULTS.CLEANUP_MIN_DAYS) {
      throw new JobServiceError(
        `olderThanDays must be at least ${DEFAULTS.CLEANUP_MIN_DAYS}`,
        ERROR_CODES.JOB_INVALID_CLEANUP_DAYS,
      );
    }

    const result = await this.jobRepository.cleanupOldJobs(olderThanDays);

    this.logger.info('Old jobs cleaned up', {
      olderThanDays,
      deletedCount: result.deletedCount,
    });

    return result;
  }

  /**
     * Get jobs by type and status
     * @public
     */
  async getJobsByTypeAndStatus(type, status = null, limit = this.config.defaultLimit) {
    this.validator.validateJobType(type);

    if (status) {
      this.validator.validateJobStatus(status);
    }

    const query = { type };
    if (status) { query.status = status; }

    return await this.jobRepository.find(query, {
      limit: this._normalizeLimit(limit),
      sort: { createdAt: -1 },
    });
  }

  /**
     * Get jobs by related entity
     * @public
     */
  async getJobsByRelatedEntity(relatedEntityId, options = {}) {
    this.validator.validateEntityId(relatedEntityId);

    const query = { relatedEntityId };

    return await this.jobRepository.find(query, {
      limit: this._normalizeLimit(options.limit),
      skip: options.skip !== undefined ? Math.max(options.skip, NUMERIC_LIMITS.DEFAULT_COUNT) : NUMERIC_LIMITS.DEFAULT_COUNT,
      sort: options.sort,
    });
  }

  /**
     * Get jobs by tags
     * @public
     */
  async getJobsByTags(tags, options = {}) {
    this.validator.validateTags(tags);

    const query = { tags: { $in: tags } };

    return await this.jobRepository.find(query, {
      limit: this._normalizeLimit(options.limit),
      skip: options.skip !== undefined ? Math.max(options.skip, NUMERIC_LIMITS.DEFAULT_COUNT) : NUMERIC_LIMITS.DEFAULT_COUNT,
      sort: options.sort,
    });
  }

  /**
     * Normalize limit value
     * @private
     */
  _normalizeLimit(limit) {
    const numLimit = limit ? parseInt(limit, 10) : this.config.defaultLimit;
    return Math.min(Math.max(numLimit, NUMERIC_LIMITS.LIMIT_MIN), this.config.maxLimit);
  }

  /**
     * Execute operation in transaction if supported
     * @private
     */
  async _executeInTransaction(operation) {
    return await TransactionManager.executeAtomic(operation);
  }
}

// Export classes only - constants should be imported from @constants
module.exports = JobService;
module.exports.JobServiceError = JobServiceError;
module.exports.JobNotFoundError = JobNotFoundError;
module.exports.InvalidJobStateError = InvalidJobStateError;
