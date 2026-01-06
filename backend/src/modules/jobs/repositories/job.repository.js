/**
 * JOB REPOSITORY
 *
 * Data access layer for job operations.
 * Handles CRUD operations for background jobs.
 *
 * @module modules/jobs/repositories/job.repository
 */

const { JobModel } = require('../models/job.model');
const { JOB_STATUS, NUMERIC_LIMITS, PAGINATION, TIME_CONSTANTS } = require('@constants');

class JobRepository {
  constructor() {
    this.model = JobModel;
  }

  /**
     * Create a new job
     */
  async create(jobData, options = {}) {
    const job = new this.model(jobData);
    // Only pass options if session is truthy to avoid triggering transaction mode
    const saveOptions = options.session ? { session: options.session } : {};
    return await job.save(saveOptions);
  }

  /**
     * Find job by ID
     */
  async findById(jobId) {
    return await this.model.findOne({ jobId });
  }

  /**
     * Find jobs by criteria
     */
  async find(query = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      limit = PAGINATION.DEFAULT_LIMIT,
      skip = 0,
      populate = [],
    } = options;

    let dbQuery = this.model.find(query);

    if (sort) { dbQuery = dbQuery.sort(sort); }
    if (limit) { dbQuery = dbQuery.limit(limit); }
    if (skip) { dbQuery = dbQuery.skip(skip); }

    // Populate related entities
    if (populate.includes('user')) {
      dbQuery = dbQuery.populate('userId', 'email firstName lastName');
    }

    return await dbQuery.exec();
  }

  /**
     * Find jobs by user ID
     */
  async findByUserId(userId, options = {}) {
    return await this.find({ userId }, options);
  }

  /**
     * Find jobs by type
     */
  async findByType(type, options = {}) {
    return await this.find({ type }, options);
  }

  /**
     * Find jobs by status
     */
  async findByStatus(status, options = {}) {
    return await this.find({ status }, options);
  }

  /**
     * Find active jobs (pending, queued, processing, retrying)
     */
  async findActiveJobs(options = {}) {
    return await this.find({
      status: { $in: [JOB_STATUS.PENDING, JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING, JOB_STATUS.RETRYING] },
    }, options);
  }

  /**
     * Update job by ID
     */
  async updateById(jobId, updateData, options = {}) {
    return await this.model.findOneAndUpdate(
      { jobId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true, ...options },
    );
  }

  /**
     * Update job status
     */
  async updateStatus(jobId, status, additionalData = {}, options = {}) {
    const updateData = {
      status,
      updatedAt: new Date(),
      ...additionalData,
    };

    // Set timing fields based on status
    if (status === JOB_STATUS.PROCESSING && !additionalData.startedAt) {
      updateData.startedAt = new Date();
    }

    if ([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED].includes(status) && !additionalData.completedAt) {
      updateData.completedAt = new Date();
    }

    const result = await this.updateById(jobId, updateData, options);
    return result;
  }

  /**
     * Update job progress
     */
  async updateProgress(jobId, progress, currentStep = null, totalSteps = null) {
    const updateData = {
      progress: Math.max(NUMERIC_LIMITS.PROGRESS_MIN, Math.min(NUMERIC_LIMITS.PROGRESS_MAX, progress)),
      updatedAt: new Date(),
    };

    if (currentStep) { updateData.currentStep = currentStep; }
    if (totalSteps) { updateData.totalSteps = totalSteps; }

    return await this.updateById(jobId, updateData);
  }

  /**
     * Mark job as completed with result
     */
  async markCompleted(jobId, result = null) {
    return await this.updateStatus(jobId, JOB_STATUS.COMPLETED, {
      result,
      completedAt: new Date(),
      error: null, // Clear any previous error
    });
  }

  /**
     * Mark job as failed with error
     */
  async markFailed(jobId, error = null) {
    return await this.updateStatus(jobId, JOB_STATUS.FAILED, {
      error,
      completedAt: new Date(),
    });
  }

  /**
     * Increment retry count and schedule retry
     */
  async scheduleRetry(jobId, nextRetryAt = null) {
    const job = await this.findById(jobId);
    if (!job) { return null; }

    const retryCount = job.retryCount + 1;
    const retryAt = nextRetryAt;

    return await this.updateById(jobId, {
      retryCount,
      nextRetryAt: retryAt,
      status: JOB_STATUS.RETRYING,
    });
  }

  /**
     * Delete job by ID
     */
  async deleteById(jobId) {
    return await this.model.findOneAndDelete({ jobId });
  }

  /**
     * Get job statistics
     */
  async getStats(userId = null) {
    const matchStage = {};
    if (userId) { matchStage.userId = userId; }

    const stats = await this.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: '$status',
          },
          byType: {
            $push: '$type',
          },
          averageDuration: {
            $avg: {
              $cond: [
                { $and: ['$startedAt', '$completedAt'] },
                { $subtract: ['$completedAt', '$startedAt'] },
                null,
              ],
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        byStatus: {},
        byType: {},
        averageDuration: null,
      };
    }

    const result = stats[0];

    // Count by status
    const byStatus = {};
    result.byStatus.forEach(status => {
      byStatus[status] = (byStatus[status] ? byStatus[status] : 0) + 1;
    });

    // Count by type
    const byType = {};
    result.byType.forEach(type => {
      byType[type] = (byType[type] ? byType[type] : 0) + 1;
    });

    return {
      total: result.total,
      byStatus,
      byType,
      averageDuration: result.averageDuration,
    };
  }

  /**
     * Clean up old completed jobs
     */
  async cleanupOldJobs(olderThanDays) {
    const cutoffDate = new Date(Date.now() - (olderThanDays * TIME_CONSTANTS.MS_PER_DAY));

    return await this.model.deleteMany({
      status: { $in: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED] },
      completedAt: { $lt: cutoffDate },
    });
  }

  /**
     * Get jobs ready for retry
     */
  async getJobsReadyForRetry() {
    return await this.find({
      status: JOB_STATUS.RETRYING,
      nextRetryAt: { $lte: new Date() },
      retryCount: { $lt: '$maxRetries' },
    });
  }
}

module.exports = JobRepository;

