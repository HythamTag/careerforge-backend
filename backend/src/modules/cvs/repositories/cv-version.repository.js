/**
 * CV VERSION REPOSITORY
 *
 * Data access layer for CV version operations.
 * Handles database interactions for CV versions.
 *
 * @module modules/cvs/repositories/cv-version.repository
 */

const { CVVersion } = require('../models/cv-version.model');
const logger = require('@utils/logger');
const { PAGINATION, NUMERIC_LIMITS, ERROR_CODES } = require('@constants');
const { NotFoundError } = require('@errors');

class CVVersionRepository {
  /**
   * Create a new CV version
   *
   * @param {Object} versionData - Version data
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<CVVersion>} Created version
   */
  async createVersion(versionData, options = {}) {
    try {
      const version = new CVVersion(versionData);
      await version.save({ session: options.session });
      logger.info('CV version created', { cvId: version.cvId, versionNumber: version.versionNumber });
      return version;
    } catch (error) {
      logger.error('Failed to create CV version', { error: error.message, cvId: versionData.cvId });
      throw error;
    }
  }

  /**
   * Get CV versions with pagination
   *
   * @param {string} cvId - CV ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated versions
   */
  async getCVVersions(cvId, options = {}) {
    try {
      const {
        page = 1,
        limit = PAGINATION.DEFAULT_LIMIT,
        skip = undefined,
      } = options;

      const query = { cvId };
      const actualSkip = skip !== undefined ? skip : (page - 1) * limit;

      const [versions, total] = await Promise.all([
        CVVersion.find(query)
          .sort({ versionNumber: -1 })
          .skip(actualSkip)
          .limit(limit)
          .populate('userId', 'email name'),
        CVVersion.countDocuments(query),
      ]);

      return {
        versions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get CV versions', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Get latest version number for CV
   *
   * @param {string} cvId - CV ID
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<number>} Latest version number
   */
  async getLatestVersionNumber(cvId, options = {}) {
    try {
      let query = CVVersion.findOne({ cvId }).sort({ versionNumber: -1 });
      if (options.session) {
        query = query.session(options.session);
      }
      const latest = await query;
      return latest ? latest.versionNumber : 0;
    } catch (error) {
      logger.error('Failed to get latest version number', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Get version by ID
   *
   * @param {string} versionId - Version ID
   * @returns {Promise<CVVersion|null>} Version or null
   */
  async getVersionById(versionId) {
    try {
      return await CVVersion.findById(versionId).populate('userId', 'email name');
    } catch (error) {
      logger.error('Failed to get version by ID', { error: error.message, versionId });
      throw error;
    }
  }

  /**
   * Get the active version for a CV
   *
   * @param {string} cvId - CV ID
   * @returns {Promise<CVVersion|null>} Active version or null
   */
  async getActiveVersion(cvId) {
    try {
      return await CVVersion.findOne({ cvId, isActive: true }).populate('userId', 'email name');
    } catch (error) {
      logger.error('Failed to get active version', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Deactivate all versions for a given CV.
   *
   * @param {string} cvId - The ID of the CV.
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<void>}
   */
  async deactivateAllVersions(cvId, options = {}) {
    try {
      await CVVersion.updateMany({ cvId }, { isActive: false }, { session: options.session });
      logger.info('All versions deactivated for CV', { cvId });
    } catch (error) {
      logger.error('Failed to deactivate all versions', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Activate a version (set isActive to true for this version)
   *
   * @param {string} versionId - Version ID to activate
   * @param {Object} options - Options including session for transactions
   * @returns {Promise<CVVersion>} Activated version
   */
  async activateVersion(versionId, options = {}) {
    try {
      const version = await CVVersion.findByIdAndUpdate(
        versionId,
        { isActive: true },
        { new: true, session: options.session }
      ).populate('userId', 'email name');

      if (!version) {
        throw new NotFoundError('Version not found', ERROR_CODES.CV_NOT_FOUND);
      }

      logger.info('CV version activated', { versionId, versionNumber: version.versionNumber });
      return version;
    } catch (error) {
      logger.error('Failed to activate version', { error: error.message, versionId });
      throw error;
    }
  }
}

module.exports = CVVersionRepository;

