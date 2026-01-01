/**
 * CV PARSING REPOSITORY
 *
 * Data access layer for CV parsing operations.
 * Handles database interactions for parsing jobs, statistics, and configurations.
 *
 * @module modules/cv-parsing/repositories/cv-parsing.repository
 */

const { CVParsingJob, CVParsingStats, ParserConfig } = require('../models/cv-parsing.model');
const logger = require('@utils/logger');
const { PAGINATION, JOB_STATUS, CLEANUP, ERROR_CODES, PROGRESS_MILESTONES } = require('@constants');
const { NotFoundError, ErrorFactory } = require('@errors');

class CVParsingRepository {
  /**
   * Create repository instance following standard pattern
   */
  constructor() {
    this.model = CVParsingJob;
    this.statsModel = CVParsingStats;
    this.configModel = ParserConfig;
  }

  /**
   * Create a new parsing job
   *
   * @param {Object} jobData - Job data
   * @returns {Promise<CVParsingJob>} Created job
   */
  async createJob(jobData) {
    try {
      const job = new this.model(jobData);
      await job.save();
      logger.info('CV parsing job created', { jobId: job.jobId });
      return job;
    } catch (error) {
      logger.error('Failed to create CV parsing job', { error: error.message, jobData });
      throw error;
    }
  }

  /**
   * Find job by jobId
   *
   * @param {string} jobId - Job ID
   * @returns {Promise<CVParsingJob|null>} Job or null
   */
  async findJobById(jobId) {
    try {
      return await this.model.findOne({ jobId }).populate('userId', 'email name');
    } catch (error) {
      logger.error('Failed to find CV parsing job', { error: error.message, jobId });
      throw error;
    }
  }

  /**
   * Update job status and progress
   *
   * @param {string} jobId - Job ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<CVParsingJob>} Updated job
   */
  async updateJob(jobId, updates) {
    try {
      const job = await this.model.findOneAndUpdate(
        { jobId },
        {
          ...updates,
          'metadata.lastUpdated': new Date(),
        },
        { new: true },
      );

      if (!job) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }

      logger.info('CV parsing job updated', { jobId, status: job.status, progress: job.progress });
      return job;
    } catch (error) {
      logger.error('Failed to update CV parsing job', { error: error.message, jobId, updates });
      throw error;
    }
  }

  /**
   * Complete job with result
   *
   * @param {string} jobId - Job ID
   * @param {Object} result - Parsing result
   * @param {number} processingTime - Processing time in ms
   * @returns {Promise<CVParsingJob>} Completed job
   */
  async completeJob(jobId, result, processingTime) {
    try {
      const updates = {
        status: JOB_STATUS.COMPLETED,
        progress: PROGRESS_MILESTONES.COMPLETE,
        result,
        'metadata.processingEndTime': new Date(),
        'metadata.processingTime': processingTime,
      };

      const updatedJob = await this.updateJob(jobId, updates);

      // Update user statistics
      await this.updateUserStats(updatedJob.userId, {
        successful: true,
        confidence: result.confidence,
        processingTime,
        fileType: updatedJob.fileType,
      });

      logger.info('CV parsing job completed', {
        jobId,
        processingTime,
        confidence: result.confidence,
      });

      return updatedJob;
    } catch (error) {
      logger.error('Failed to complete CV parsing job', {
        error: error.message,
        jobId
      });
      throw error;
    }
  }

  /**
   * Fail job with error
   *
   * @param {string} jobId - Job ID
   * @param {Error} error - Error that occurred
   * @returns {Promise<CVParsingJob>} Failed job
   */
  async failJob(jobId, error) {
    try {
      const updates = {
        status: JOB_STATUS.FAILED,
        error: {
          message: error.message || 'Unknown error occurred',
          code: error.code || ERROR_CODES.CV_PARSING_FAILED,
          details: error.details || {},
          timestamp: new Date(),
        },
        'metadata.processingEndTime': new Date(),
      };

      const job = await this.updateJob(jobId, updates);

      // Update user statistics
      await this.updateUserStats(job.userId, {
        successful: false,
        fileType: job.fileType,
      });

      logger.warn('CV parsing job failed', {
        jobId,
        errorMessage: error.message,
        errorCode: error.code,
      });

      return job;
    } catch (updateError) {
      logger.error('Failed to mark CV parsing job as failed', {
        error: updateError.message,
        jobId,
        originalError: error.message,
      });
      throw updateError;
    }
  }

  /**
   * Cancel job
   *
   * @param {string} jobId - Job ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<CVParsingJob>} Cancelled job
   */
  async cancelJob(jobId, reason = 'Cancelled by user') {
    try {
      const updates = {
        status: JOB_STATUS.CANCELLED,
        error: {
          message: reason,
          code: ERROR_CODES.JOB_CANCELLED,
          timestamp: new Date(),
        },
        'metadata.processingEndTime': new Date(),
      };

      const job = await this.updateJob(jobId, updates);

      // Update user statistics
      await this.updateUserStats(job.userId, {
        cancelled: true,
        fileType: job.fileType,
      });

      logger.info('CV parsing job cancelled', { jobId, reason });

      return job;
    } catch (error) {
      logger.error('Failed to cancel CV parsing job', {
        error: error.message,
        jobId
      });
      throw error;
    }
  }

  /**
   * Get user's parsing jobs with pagination
   *
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async getUserJobs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = PAGINATION.PARSING_HISTORY_LIMIT,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const query = { userId };

      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select('-result.parsedContent') // Exclude large parsed content
          .lean(),
        this.model.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get user CV parsing jobs', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   *
   * @param {string} userId - User ID
   * @returns {Promise<CVParsingStats>} User statistics
   */
  async getUserStats(userId) {
    try {
      let stats = await this.statsModel.findOne({ userId });

      if (!stats) {
        stats = await this.statsModel.create({
          userId,
          firstParsingDate: new Date(),
        });
        logger.info('Created new CV parsing stats', { userId });
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get CV parsing user stats', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Update user statistics
   *
   * @param {string} userId - User ID
   * @param {Object} updates - Statistics updates
   * @returns {Promise<CVParsingStats>} Updated statistics
   */
  async updateUserStats(userId, updates) {
    try {
      const incrementFields = {
        totalParsings: 1,
        [`parsingByFileType.${updates.fileType}`]: 1,
      };

      if (updates.successful) {
        incrementFields.successfulParsings = 1;
      } else if (updates.cancelled) {
        incrementFields.cancelledParsings = 1;
      } else {
        incrementFields.failedParsings = 1;
      }

      // For averages, we need to fetch current stats first
      const currentStats = await this.getUserStats(userId);

      const setFields = {
        lastParsingDate: new Date(),
      };

      // Update average confidence
      if (updates.confidence !== undefined && updates.successful) {
        const totalSuccessful = currentStats.successfulParsings + 1;
        const currentTotal = currentStats.averageConfidence * currentStats.successfulParsings;
        setFields.averageConfidence = (currentTotal + updates.confidence) / totalSuccessful;
      }

      // Update average processing time
      if (updates.processingTime !== undefined && updates.successful) {
        const totalSuccessful = currentStats.successfulParsings + 1;
        const currentTotal = currentStats.averageProcessingTime * currentStats.successfulParsings;
        setFields.averageProcessingTime = (currentTotal + updates.processingTime) / totalSuccessful;
      }

      // Set first parsing date if not set
      if (!currentStats.firstParsingDate) {
        setFields.firstParsingDate = new Date();
      }

      const stats = await this.statsModel.findOneAndUpdate(
        { userId },
        {
          $inc: incrementFields,
          $set: setFields,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      logger.debug('Updated CV parsing user stats', {
        userId,
        totalParsings: stats.totalParsings,
      });

      return stats;
    } catch (error) {
      logger.error('Failed to update CV parsing user stats', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get parser configurations
   *
   * @param {Object} filters - Filter options
   * @returns {Promise<Array<ParserConfig>>} Parser configurations
   */
  async getParserConfigs(filters = {}) {
    try {
      const query = { isActive: true, ...filters };
      return await this.configModel
        .find(query)
        .sort({ name: 1 })
        .lean();
    } catch (error) {
      logger.error('Failed to get parser configurations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get parser configuration by name
   *
   * @param {string} name - Parser name
   * @returns {Promise<ParserConfig|null>} Parser configuration
   */
  async getParserConfigByName(name) {
    try {
      return await this.configModel.findOne({
        name,
        isActive: true
      }).lean();
    } catch (error) {
      logger.error('Failed to get parser configuration', {
        error: error.message,
        name
      });
      throw error;
    }
  }

  /**
   * Count active jobs for user
   *
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of active jobs
   */
  async countActiveJobs(userId) {
    try {
      return await this.model.countDocuments({
        userId,
        status: {
          $in: [JOB_STATUS.PENDING, JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING]
        },
      });
    } catch (error) {
      logger.error('Failed to count active jobs', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Clean up old jobs (for maintenance)
   *
   * @param {number} maxAgeDays - Maximum age in days
   * @returns {Promise<number>} Number of cleaned jobs
   */
  async cleanupOldJobs(maxAgeDays = CLEANUP.JOB_CLEANUP_DAYS_OLD) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const result = await this.model.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: {
          $in: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED]
        },
      });

      logger.info('Cleaned up old CV parsing jobs', {
        deletedCount: result.deletedCount,
        maxAgeDays
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old CV parsing jobs', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get job statistics for admin dashboard
   *
   * @param {Object} filters - Filter options (dateRange, status, etc.)
   * @returns {Promise<Object>} Job statistics
   */
  async getJobStatistics(filters = {}) {
    try {
      const matchStage = {};

      if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
      }

      const stats = await this.model.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', JOB_STATUS.COMPLETED] }, 1, 0] }
            },
            failedJobs: {
              $sum: { $cond: [{ $eq: ['$status', JOB_STATUS.FAILED] }, 1, 0] }
            },
            cancelledJobs: {
              $sum: { $cond: [{ $eq: ['$status', JOB_STATUS.CANCELLED] }, 1, 0] }
            },
            activeJobs: {
              $sum: {
                $cond: [
                  {
                    $in: ['$status', [
                      JOB_STATUS.PENDING,
                      JOB_STATUS.QUEUED,
                      JOB_STATUS.PROCESSING
                    ]]
                  },
                  1,
                  0
                ]
              }
            },
            avgProcessingTime: { $avg: '$result.processingTime' },
            avgConfidence: { $avg: '$result.confidence' },
          },
        },
      ]);

      return stats[0] || {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        cancelledJobs: 0,
        activeJobs: 0,
        avgProcessingTime: 0,
        avgConfidence: 0,
      };
    } catch (error) {
      logger.error('Failed to get job statistics', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = CVParsingRepository;

