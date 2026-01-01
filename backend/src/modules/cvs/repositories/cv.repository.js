/**
 * CV REPOSITORY
 *
 * Data access layer for CV operations.
 * Handles database interactions for CVs.
 *
 * @module modules/cvs/repositories/cv.repository
 */

const { CV } = require('../models/cv.model');
const logger = require('@utils/logger');
const { PAGINATION, NUMERIC_LIMITS, CV_ENTITY_STATUS, ERROR_CODES } = require('@constants');
const { NotFoundError, ErrorFactory } = require('@errors');

class CVRepository {
  /**
   * Create a new CV
   *
   * @param {Object} cvData - CV data
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<CV>} Created CV
   */
  async createCV(cvData, options = {}) {
    try {
      const cv = new CV(cvData);
      await cv.save({ session: options.session });
      logger.info('CV created', { cvId: cv.id, userId: cv.userId });
      return cv;
    } catch (error) {
      logger.error('Failed to create CV', { error: error.message, userId: cvData.userId });
      throw error;
    }
  }

  /**
   * Find CV by ID and user
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @returns {Promise<CV|null>} CV or null
   */
  async getCVById(cvId, userId) {
    try {
      // Don't populate userId in worker context to avoid model registration issues
      // User data is not needed for CV processing operations
      return await CV.findOne({ _id: cvId, userId });
    } catch (error) {
      logger.error('Failed to find CV', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Update CV
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @param {Object} updates - Updates to apply
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<CV>} Updated CV
   */
  async updateCV(cvId, userId, updates, options = {}) {
    try {
      const cv = await CV.findOneAndUpdate(
        { _id: cvId, userId },
        {
          ...updates,
          'metadata.lastModifiedBy': userId
        },
        { new: true, session: options.session }
      );

      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      logger.info('CV updated', { cvId, userId });
      return cv;
    } catch (error) {
      logger.error('Failed to update CV', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Update CV by ID only (for worker/system use)
   *
   * @param {string} cvId - CV ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<CV>} Updated CV
   */
  async updateById(cvId, updates) {
    try {
      const cv = await CV.findByIdAndUpdate(
        cvId,
        updates,
        { new: true }
      );

      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      logger.debug('CV updated by ID', { cvId, updatedFields: Object.keys(updates) });
      return cv;
    } catch (error) {
      logger.error('Failed to update CV by ID', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Delete CV (soft delete by setting status to deleted)
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @returns {Promise<CV>} Deleted CV
   */
  async deleteCV(cvId, userId) {
    try {
      const cv = await CV.findOneAndUpdate(
        { _id: cvId, userId },
        { status: CV_ENTITY_STATUS.DELETED },
        { new: true }
      );

      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      logger.info('CV deleted', { cvId, userId });
      return cv;
    } catch (error) {
      logger.error('Failed to delete CV', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Get user's CVs with pagination and filtering
   *
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async getUserCVs(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = PAGINATION.PARSING_HISTORY_LIMIT,
        status,
        search,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = { userId };
      if (status && status !== 'all') {
        query.status = status;
      } else if (!status) {
        // Default to non-deleted CVs
        query.status = { $ne: CV_ENTITY_STATUS.DELETED };
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [cvs, total] = await Promise.all([
        CV.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select('-content') // Exclude content for list view
          .populate('userId', 'email name'),
        CV.countDocuments(query)
      ]);

      return {
        cvs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get user CVs', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Search CVs
   *
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchCVs(userId, options = {}) {
    try {
      const {
        query,
        tags = [],
        status,
        page = 1,
        limit = PAGINATION.DEFAULT_LIMIT
      } = options;

      const searchQuery = { userId };

      // Add status filter
      if (status && status !== 'all') {
        searchQuery.status = status;
      } else {
        searchQuery.status = { $ne: CV_ENTITY_STATUS.DELETED };
      }

      // Add text search
      if (query) {
        searchQuery.$text = { $search: query };
      }

      // Add tags filter
      if (tags.length > 0) {
        searchQuery.tags = { $in: tags };
      }

      const skip = (page - 1) * limit;

      const [cvs, total] = await Promise.all([
        CV.find(searchQuery, { score: { $meta: 'textScore' } })
          .sort(query ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-content'),
        CV.countDocuments(searchQuery)
      ]);

      return {
        cvs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to search CVs', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get CV statistics for user
   *
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  async getCVStats(userId) {
    try {
      const mongoose = require('mongoose');
      const stats = await CV.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: '$status'
            },
            totalViews: { $sum: '$metadata.viewCount' },
            totalDownloads: { $sum: '$metadata.downloadCount' },
            publishedCount: {
              $sum: { $cond: [{ $eq: ['$metadata.isPublic', true] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            byStatus: {
              draft: { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', CV_ENTITY_STATUS.DRAFT] } } } },
              published: { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', CV_ENTITY_STATUS.PUBLISHED] } } } },
              archived: { $size: { $filter: { input: '$byStatus', cond: { $eq: ['$$this', CV_ENTITY_STATUS.ARCHIVED] } } } }
            },
            totalViews: 1,
            totalDownloads: 1,
            publishedCount: 1
          }
        }
      ]);

      return stats[0] ? stats[0] : {
        total: 0,
        byStatus: {
          [CV_ENTITY_STATUS.DRAFT]: 0,
          [CV_ENTITY_STATUS.PUBLISHED]: 0,
          [CV_ENTITY_STATUS.ARCHIVED]: 0,
        },
        totalViews: 0,
        totalDownloads: 0,
        publishedCount: 0,
      };
    } catch (error) {
      logger.error('Failed to get CV stats', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Duplicate CV
   *
   * @param {string} cvId - Original CV ID
   * @param {string} userId - User ID
   * @param {string} newTitle - New CV title
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<CV>} Duplicated CV
   */
  async duplicateCV(cvId, userId, newTitle, options = {}) {
    try {
      const originalCV = await CV.findOne({ _id: cvId, userId });
      if (!originalCV) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      const duplicatedData = {
        ...originalCV.toObject(),
        _id: undefined,
        title: newTitle ? newTitle : `${originalCV.title} (Copy)`,
        status: CV_ENTITY_STATUS.DRAFT,
        metadata: {
          ...originalCV.metadata,
          viewCount: 0,
          downloadCount: 0,
          shareCount: 0,
          isPublic: false,
          publicUrl: undefined
        }
      };

      const duplicatedCV = new CV(duplicatedData);
      await duplicatedCV.save({ session: options.session });

      logger.info('CV duplicated', { originalId: cvId, newId: duplicatedCV.id, userId });
      return duplicatedCV;
    } catch (error) {
      logger.error('Failed to duplicate CV', { error: error.message, cvId, userId });
      throw error;
    }
  }
}

module.exports = CVRepository;

