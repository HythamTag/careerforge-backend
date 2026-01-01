/**
 * CV ATS REPOSITORY
 *
 * Data access layer for CV ATS analysis job operations.
 * Handles CRUD operations and complex queries for ATS analysis jobs.
 *
 * @module modules/cv-ats/repositories/cv-ats.repository
 */

const { CvAtsModel } = require('../models/cv-ats.model');
const { ATS_STATUS, JOB_LIMITS, PAGINATION, CLEANUP, CV_ATS, TIME_CONSTANTS, ERROR_CODES } = require('@constants');
const { ValidationError, ErrorFactory } = require('@errors');

class CvAtsRepository {
  constructor() {
    this.model = CvAtsModel;
  }

  async create(cvAtsData, options = {}) {
    try {
      const cvAts = new this.model(cvAtsData);
      return await cvAts.save({ session: options.session });
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to create ATS analysis', error);
    }
  }

  /**
   * Find ATS analysis job by ID
   * @param {string} id - Analysis ID
   * @returns {Promise<Object>} Analysis record
   */
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to find ATS analysis by ID', error);
    }
  }

  /**
   * Find ATS analysis job by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Analysis record
   */
  async findByJobId(jobId) {
    try {
      return await this.model.findByJobId(jobId);
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to find ATS analysis by Job ID', error);
    }
  }

  /**
   * Update ATS analysis job by ID
   * @param {string} id - Analysis ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options including session
   * @returns {Promise<Object>} Updated analysis record
   */
  async updateById(id, updateData, options = {}) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        session: options.session,
      });
    } catch (error) {
      throw ErrorFactory.databaseError(`Failed to update ATS analysis ${id}`, error);
    }
  }

  /**
   * Delete ATS analysis job by ID
   * @param {string} id - Analysis ID
   * @returns {Promise<Object>} Deleted record
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw ErrorFactory.databaseError(`Failed to delete ATS analysis ${id}`, error);
    }
  }

  /**
   * Find ATS analysis jobs by user ID with filters
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of analysis records
   */
  async findByUserId(userId, options = {}) {
    try {
      return await this.model.findByUserId(userId, options);
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to find user ATS analyses', error);
    }
  }

  /**
   * Count ATS analysis jobs by user ID with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Count filters
   * @returns {Promise<number>} Count of records
   */
  async countByUserId(userId, filters = {}) {
    try {
      return await this.model.countByUserId(userId, filters);
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to count user ATS analyses', error);
    }
  }

  /**
     * Get user statistics
     */
  async getUserStats(userId) {
    return await this.model.getUserStats(userId);
  }

  /**
     * Get score distribution for user
     */
  async getScoreDistribution(userId) {
    return await this.model.getScoreDistribution(userId);
  }

  /**
     * Get top suggestions for user
     */
  async getTopSuggestions(userId, limit = CV_ATS.DEFAULT_TOP_SUGGESTIONS_LIMIT) {
    return await this.model.getTopSuggestions(userId, limit);
  }

  /**
     * Cancel ATS analysis job
     */
  async cancelJob(id) {
    return await this.model.findByIdAndUpdate(id, {
      status: ATS_STATUS.CANCELLED,
      cancelledAt: new Date(),
    }, { new: true });
  }

  /**
     * Mark job as started
     */
  async markAsStarted(id) {
    const atsAnalysis = await this.model.findById(id);
    if (atsAnalysis) {
      return await atsAnalysis.markAsStarted();
    }
    return null;
  }

  /**
     * Mark job as completed with results
     */
  async markAsCompleted(id, results) {
    const atsAnalysis = await this.model.findById(id);
    if (atsAnalysis) {
      return await atsAnalysis.markAsCompleted(results);
    }
    return null;
  }

  /**
     * Mark job as failed with error
     */
  async markAsFailed(id, error) {
    const atsAnalysis = await this.model.findById(id);
    if (atsAnalysis) {
      return await atsAnalysis.markAsFailed(error);
    }
    return null;
  }

  /**
     * Increment retry count
     */
  async incrementRetry(id) {
    const atsAnalysis = await this.model.findById(id);
    if (atsAnalysis) {
      return await atsAnalysis.incrementRetry();
    }
    return null;
  }

  /**
   * Find an active job for a CV and type
   */
  async findActiveJob(cvId, type, versionId = null, targetJobDescription = null) {
    try {
      const query = {
        cvId,
        type,
        status: { $in: [ATS_STATUS.PENDING, ATS_STATUS.PROCESSING] },
      };

      if (versionId) {
        query.versionId = versionId;
      } else {
        query.versionId = { $exists: false };
      }

      // If specific job description target provided, match it
      if (targetJobDescription) {
        query['targetJob.description'] = targetJobDescription;
      }

      return await this.model.findOne(query).sort({ createdAt: -1 });
    } catch (error) {
      throw ErrorFactory.databaseError('Failed to find active ATS job', error);
    }
  }

  /**
     * Get pending jobs for processing
     */
  async getPendingJobs(limit = PAGINATION.PARSING_HISTORY_LIMIT) {
    return await this.model.find({
      status: ATS_STATUS.PENDING,
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('job');
  }

  /**
     * Get processing jobs that may have timed out
     */
  async getStuckJobs(timeoutMinutes = JOB_LIMITS.STUCK_JOB_TIMEOUT_MINUTES) {
    const timeoutDate = new Date(Date.now() - (timeoutMinutes * TIME_CONSTANTS.MS_PER_MINUTE));

    return await this.model.find({
      status: ATS_STATUS.PROCESSING,
      startedAt: { $lt: timeoutDate },
    })
      .populate('job');
  }

  /**
     * Update job progress
     */
  async updateProgress(id, progress, currentStep = null) {
    const updateData = { progress };
    if (currentStep) {
      updateData.currentStep = currentStep;
    }

    return await this.model.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
     * Bulk update job statuses (for maintenance)
     */
  async bulkUpdateStatuses(jobIds, status, additionalData = {}) {
    return await this.model.updateMany(
      { _id: { $in: jobIds } },
      { ...additionalData, status, updatedAt: new Date() },
    );
  }

  /**
     * Clean up old failed jobs
     */
  async cleanupOldJobs(daysOld = CLEANUP.JOB_CLEANUP_DAYS_OLD) {
    const cutoffDate = new Date(Date.now() - (daysOld * TIME_CONSTANTS.MS_PER_DAY));

    return await this.model.deleteMany({
      status: ATS_STATUS.FAILED,
      createdAt: { $lt: cutoffDate },
    });
  }

  /**
     * Get jobs by status
     */
  async getJobsByStatus(status, options = {}) {
    const query = this.model.find({ status });

    if (options.limit) { query.limit(options.limit); }
    if (options.sort) { query.sort(options.sort); }

    if (options.populate) {
      options.populate.forEach(field => {
        query.populate(field);
      });
    }

    return await query;
  }

  /**
     * Get analysis trends for user
     */
  async getAnalysisTrends(userId, timeframe = CV_ATS.DEFAULT_TIMEFRAME) {
    // Parse timeframe (e.g., '7d', '30d', '90d')
    const daysMatch = timeframe.match(/^(\d+)d$/);
    if (!daysMatch) {
      throw new ValidationError(`Invalid timeframe format: ${timeframe}. Expected format: 'Nd' (e.g., '30d')`, ERROR_CODES.VALIDATION_ERROR);
    }
    const days = parseInt(daysMatch[1], 10);
    const startDate = new Date(Date.now() - (days * TIME_CONSTANTS.MS_PER_DAY));

    return await this.model.aggregate([
      {
        $match: {
          userId: this.model.convertToObjectId(userId),
          createdAt: { $gte: startDate },
          status: ATS_STATUS.COMPLETED,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
          averageScore: { $avg: '$results.overallScore' },
          averageProcessingTime: { $avg: '$processingTimeMs' },
        },
      },
      {
        $sort: { '_id': 1 },
      },
    ]);
  }

  /**
     * Get recent analyses with scores
     */
  async getRecentAnalysesWithScores(userId, limit = PAGINATION.PARSING_HISTORY_LIMIT) {
    return await this.model.find({
      userId,
      status: ATS_STATUS.COMPLETED,
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select('jobId results.overallScore results.keywordMatch results.experienceMatch results.skillsMatch completedAt targetJob.title targetJob.company')
      .populate('job', 'type priority');
  }
}

module.exports = CvAtsRepository;

