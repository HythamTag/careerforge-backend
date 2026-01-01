// ============================================================================
// FILE: modules/cv-generation/repositories/generation.repository.js
// ============================================================================

/**
 * GENERATION REPOSITORY
 *
 * Data access layer - ONLY handles database operations.
 * All business logic moved to service layer.
 */

const { GenerationModel } = require('../models/generation.model');
const { GENERATION_STATUS, PAGINATION } = require('@constants');
const { ErrorFactory } = require('@errors');
const { logger } = require('@utils');

class GenerationRepository {
  constructor() {
    this.model = GenerationModel;
  }

  /**
   * Create a new generation job
   */
  async create(generationData, options = {}) {
    try {
      const generation = new this.model(generationData);
      return await generation.save(options);
    } catch (error) {
      logger.error('Failed to create generation job', {
        error: error.message,
        userId: generationData.userId,
        outputFormat: generationData.outputFormat,
      });
      throw ErrorFactory.databaseError('Failed to create generation job', error);
    }
  }

  /**
   * Find generation job by ID
   */
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      logger.error('Failed to find generation by ID', { error: error.message, id });
      throw ErrorFactory.databaseError(`Failed to find generation ${id}`, error);
    }
  }

  /**
   * Find generation job by job ID
   */
  async findByJobId(jobId) {
    try {
      return await this.model.findOne({ jobId });
    } catch (error) {
      logger.error('Failed to find generation by job ID', { error: error.message, jobId });
      throw ErrorFactory.databaseError(`Failed to find generation for job ${jobId}`, error);
    }
  }

  /**
   * Find generation job by ID and user (security check)
   */
  async findByIdAndUser(id, userId) {
    try {
      return await this.model.findOne({ _id: id, userId });
    } catch (error) {
      logger.error('Failed to find generation by ID and user', { error: error.message, id, userId });
      throw ErrorFactory.databaseError(`Failed to find generation ${id} for user`, error);
    }
  }

  /**
   * Update generation job by ID
   */
  async updateById(id, updateData, options = {}) {
    try {
      return await this.model.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true, session: options.session }
      );
    } catch (error) {
      logger.error('Failed to update generation', { error: error.message, id });
      throw ErrorFactory.databaseError(`Failed to update generation ${id}`, error);
    }
  }

  /**
   * Update generation job by job ID
   */
  async updateByJobId(jobId, updateData, options = {}) {
    try {
      return await this.model.findOneAndUpdate(
        { jobId },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true, session: options.session }
      );
    } catch (error) {
      logger.error('Failed to update generation by job ID', { error: error.message, jobId });
      throw ErrorFactory.databaseError(`Failed to update generation for job ${jobId}`, error);
    }
  }

  /**
   * Delete generation job
   */
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      logger.error('Failed to delete generation', { error: error.message, id });
      throw ErrorFactory.databaseError(`Failed to delete generation ${id}`, error);
    }
  }

  /**
   * Find generation jobs by user ID with filters
   */
  async findByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }
    if (filters.type) query.type = filters.type;
    if (filters.format) query.outputFormat = filters.format;
    if (filters.cvId) query.cvId = filters.cvId;
    if (filters.templateId) query.templateId = filters.templateId;

    if (filters.dateFrom) {
      query.createdAt = { ...query.createdAt, $gte: filters.dateFrom };
    }
    if (filters.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: filters.dateTo };
    }

    let dbQuery = this.model.find(query);

    // Sorting
    dbQuery = dbQuery.sort(filters.sort || { createdAt: -1 });

    // Pagination
    if (filters.limit) dbQuery = dbQuery.limit(filters.limit);
    if (filters.skip) dbQuery = dbQuery.skip(filters.skip);

    // Population
    if (filters.populate) {
      if (filters.populate.includes('job')) {
        dbQuery = dbQuery.populate('jobId', 'status progress createdAt updatedAt');
      }
      if (filters.populate.includes('cv')) {
        dbQuery = dbQuery.populate('cvId', 'title status activeVersion');
      }
      if (filters.populate.includes('version')) {
        dbQuery = dbQuery.populate('versionId', 'versionNumber title');
      }
    }

    return await dbQuery.exec();
  }

  /**
   * Count generation jobs by user ID with filters
   */
  async countByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }
    if (filters.type) query.type = filters.type;
    if (filters.format) query.outputFormat = filters.format;
    if (filters.cvId) query.cvId = filters.cvId;
    if (filters.templateId) query.templateId = filters.templateId;

    return await this.model.countDocuments(query);
  }

  async getPendingJobs(limit = PAGINATION.PARSING_HISTORY_LIMIT) {
    try {
      return await this.model.find({ status: GENERATION_STATUS.PENDING })
        .sort({ priority: -1, queuedAt: 1 })
        .limit(limit)
        .populate('jobId')
        .populate('cvId', 'title')
        .populate('versionId', 'versionNumber title');
    } catch (error) {
      logger.error('Failed to get pending jobs', { error: error.message });
      throw ErrorFactory.databaseError('Failed to get pending jobs', error);
    }
  }

  async getUserStats(userId) {
    try {
      const mongoose = require('mongoose');
      return await this.model.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            pendingJobs: { $sum: { $cond: [{ $eq: ['$status', GENERATION_STATUS.PENDING] }, 1, 0] } },
            processingJobs: { $sum: { $cond: [{ $eq: ['$status', GENERATION_STATUS.PROCESSING] }, 1, 0] } },
            completedJobs: { $sum: { $cond: [{ $eq: ['$status', GENERATION_STATUS.COMPLETED] }, 1, 0] } },
            failedJobs: { $sum: { $cond: [{ $eq: ['$status', GENERATION_STATUS.FAILED] }, 1, 0] } },
            cancelledJobs: { $sum: { $cond: [{ $eq: ['$status', GENERATION_STATUS.CANCELLED] }, 1, 0] } },
            totalFileSize: { $sum: { $ifNull: ['$outputFile.fileSize', 0] } },
            avgQualityScore: { $avg: '$qualityScore' },
            avgProcessingTime: { $avg: '$generationStats.processingTimeMs' },
          },
        },
        {
          $project: {
            _id: 0,
            totalJobs: 1,
            pendingJobs: 1,
            processingJobs: 1,
            completedJobs: 1,
            failedJobs: 1,
            cancelledJobs: 1,
            totalFileSize: 1,
            avgQualityScore: { $round: ['$avgQualityScore', 2] },
            avgProcessingTime: { $round: ['$avgProcessingTime', 0] },
          },
        },
      ]);
    } catch (error) {
      logger.error('Failed to get user stats', { error: error.message, userId });
      throw ErrorFactory.databaseError('Failed to retrieve user statistics', error);
    }
  }

  /**
   * Get generation statistics by format
   */
  async getFormatStats(userId) {
    try {
      return await this.model.aggregate([
        { $match: { userId, status: GENERATION_STATUS.COMPLETED } },
        {
          $group: {
            _id: '$outputFormat',
            count: { $sum: 1 },
            totalSize: { $sum: { $ifNull: ['$outputFile.fileSize', 0] } },
            avgProcessingTime: { $avg: '$generationStats.processingTimeMs' },
          },
        },
        {
          $project: {
            format: '$_id',
            count: 1,
            totalSize: 1,
            avgProcessingTime: { $round: ['$avgProcessingTime', 0] },
            _id: 0,
          },
        },
        { $sort: { count: -1 } },
      ]);
    } catch (error) {
      logger.error('Failed to get format stats', { error: error.message, userId });
      throw ErrorFactory.databaseError('Failed to retrieve format statistics', error);
    }
  }

  /**
   * Bulk update operations
   */
  async bulkUpdate(userId, jobIds, updateData) {
    try {
      return await this.model.updateMany(
        { _id: { $in: jobIds }, userId },
        { ...updateData, updatedAt: new Date() }
      );
    } catch (error) {
      logger.error('Failed to bulk update generations', { error: error.message, userId, count: jobIds.length });
      throw ErrorFactory.databaseError('Failed to bulk update generations', error);
    }
  }
}

module.exports = GenerationRepository;

