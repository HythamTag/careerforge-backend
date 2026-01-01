/**
 * CV VERSION SERVICE
 *
 * Business logic layer for CV version operations.
 * Handles version creation, retrieval, and activation.
 *
 * @module modules/cvs/services/cv-version.service
 */

const mongoose = require('mongoose');
const logger = require('@utils/logger');
const TransactionManager = require('@infrastructure/transaction.manager');
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');
const {
  ERROR_CODES,
  CV_VERSION_CHANGE_TYPE,
  CV_VERSION_NAMES,
  CV_VERSION_DESCRIPTIONS,
} = require('@constants');

class CVVersionService {
  /**
   * Create CV version service with dependency injection.
   */
  constructor(cvVersionRepository, cvRepository) {
    this.cvVersionRepository = cvVersionRepository;
    this.cvRepository = cvRepository;
  }

  /**
   * Create a new version
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @param {Object} content - CV content
   * @param {string} name - Version name
   * @param {string} description - Version description
   * @param {string} changeType - Type of change
   * @returns {Promise<CVVersion>} Created version
   */
  async createVersion(cvId, userId, content, name, description, changeType = 'manual') {
    try {
      // Get CV for validation
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      // For manual version creation, allow empty content as a checkpoint
      // For other change types, require non-empty content
      const allowEmpty = changeType === 'manual';
      this._validateContent(content, allowEmpty);

      const latestVersionNumber = await this.cvVersionRepository.getLatestVersionNumber(cvId, {});
      const versionNumber = latestVersionNumber + 1;

      return await this.cvVersionRepository.createVersion({
        cvId,
        versionNumber,
        userId,
        name: name || CV_VERSION_NAMES.MANUAL_CREATION,
        description: description || name,
        content,
        changeType,
      });
    } catch (error) {
      logger.error('Version creation failed', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Validate content structure (allows empty for checkpoints)
   *
   * @private
   * @param {Object} content - CV content to validate
   * @param {boolean} allowEmpty - Whether to allow empty content (for checkpoints)
   */
  _validateContent(content, allowEmpty = false) {
    if (!content || typeof content !== 'object') {
      throw new ValidationError('Content must be a valid object', ERROR_CODES.VALIDATION_ERROR);
    }

    // Only check for empty if not allowing empty content
    if (!allowEmpty && Object.keys(content).length === 0) {
      throw new ValidationError('Content cannot be empty', ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Get CV versions with pagination
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated versions
   */
  async getCVVersions(cvId, userId, options = {}) {
    try {
      // Authorization check: ensure user owns the CV
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      return await this.cvVersionRepository.getCVVersions(cvId, options);
    } catch (error) {
      logger.logOperationError('Get CV versions', error, { cvId, userId });
      throw error;
    }
  }

  /**
   * Get a specific CV version
   *
   * @param {string} cvId - CV ID
   * @param {string} versionId - Version ID
   * @param {string} userId - User ID
   * @returns {Promise<CVVersion>} Version
   */
  async getCVVersion(cvId, versionId, userId) {
    try {
      // Authorization check: ensure user owns the CV
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      const version = await this.cvVersionRepository.getVersionById(versionId);
      if (!version) {
        throw ErrorFactory.versionNotFound(versionId);
      }

      // Verify version belongs to the CV
      if (version.cvId.toString() !== cvId) {
        throw new NotFoundError('Version not found for this CV', ERROR_CODES.CV_NOT_FOUND);
      }

      return version;
    } catch (error) {
      logger.logOperationError('Get CV version', error, { cvId, versionId, userId });
      throw error;
    }
  }

  /**
   * Activate a CV version (restore it as the current version)
   *
   * @param {string} cvId - CV ID
   * @param {string} versionId - Version ID to activate
   * @param {string} userId - User ID
   * @param {string} newVersionName - Name for the new version created after activation
   * @param {string} newVersionDescription - Description for the new version created after activation
   * @returns {Promise<Object>} Updated CV and activated version
   */
  async activateVersion(cvId, versionId, userId, newVersionName, newVersionDescription) {
    return await TransactionManager.executeAtomic(async (session) => {
      // Authorization check: ensure user owns the CV
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      // Get the version to restore
      const version = await this.cvVersionRepository.getVersionById(versionId);
      if (!version) {
        throw ErrorFactory.versionNotFound(versionId);
      }

      // Verify version belongs to the CV
      if (version.cvId.toString() !== cvId) {
        throw ErrorFactory.notFound('Version not found for this CV', ERROR_CODES.CV_NOT_FOUND);
      }

      // Check if we're restoring the same content (no need to create version)
      const isSameContent = JSON.stringify(cv.content) === JSON.stringify(version.content);
      if (isSameContent) {
        // Just activate the version and deactivate others
        await this.cvVersionRepository.deactivateAllVersions(cvId, { session });
        const activatedVersion = await this.cvVersionRepository.activateVersion(versionId, { session });
        return {
          cv: await this.cvRepository.getCVById(cvId, userId),
          version: activatedVersion,
        };
      }

      // Save current CV content as a version before overwriting (if content exists)
      if (cv.content && Object.keys(cv.content).length > 0) {
        const latestVersionNumber = await this.cvVersionRepository.getLatestVersionNumber(cvId, { session });
        const versionNumber = latestVersionNumber + 1;

        await this.cvVersionRepository.createVersion({
          cvId,
          versionNumber,
          userId,
          name: CV_VERSION_NAMES.BEFORE_RESTORE,
          description: CV_VERSION_DESCRIPTIONS.BEFORE_RESTORE(version.versionNumber),
          content: cv.content,
          changeType: CV_VERSION_CHANGE_TYPE.MANUAL,
        }, { session });
      }

      // Deactivate all versions for this CV
      await this.cvVersionRepository.deactivateAllVersions(cvId, { session });

      // Activate the specified version
      const activatedVersion = await this.cvVersionRepository.activateVersion(versionId, { session });

      // Update CV content to match the activated version (DO NOT overwrite title)
      await this.cvRepository.updateCV(cvId, userId, {
        content: version.content,
        // Note: We do NOT update title - version.name is not the CV title
      }, { session });

      logger.info('CV version activated successfully', { cvId, versionId, versionNumber: version.versionNumber });

      return {
        cv: await this.cvRepository.getCVById(cvId, userId),
        version: activatedVersion,
      };
    });
  }
}

module.exports = CVVersionService;

