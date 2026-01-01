/**
 * CV SERVICE
 *
 * Business logic layer for CV operations.
 * Handles CV lifecycle, validation, and complex operations.
 *
 * @module modules/cvs/services/cv.service
 */

const mongoose = require('mongoose');
const { logger } = require('@utils');
const transactionManager = require('@infrastructure/transaction.manager');
const CVRepository = require('../repositories/cv.repository');
const CVVersionRepository = require('../repositories/cv-version.repository');
const { CV } = require('../models/cv.model');
const { CVError, ValidationError, NotFoundError, ErrorFactory } = require('@errors');
const {
  ERROR_CODES,
  CV_ENTITY_STATUS,
  CV_SOURCE,
  CV_VERSION_CHANGE_TYPE,
  CV_VERSION_NAMES,
  CV_VERSION_DESCRIPTIONS,
  CV_CONTENT_SECTIONS,
  CV_BULK_OPERATIONS,
  CV_PUBLIC_URL,
} = require('@constants');

class CVService {
  /**
   * Create CV service with dependency injection.
   */
  constructor(cvRepository, cvVersionRepository, fileService, cvParsingService) {
    this.cvRepository = cvRepository;
    this.cvVersionRepository = cvVersionRepository;
    this.fileService = fileService;
    this.cvParsingService = cvParsingService;
  }

  /**
   * Create a new CV
   *
   * @param {Object} cvData - CV data
   * @returns {Promise<CV>} Created CV
   */
  async createCV(cvData) {
    return await transactionManager.executeAtomic(async (session) => {
      // Validate CV data
      this._validateCVData(cvData);

      // Create CV
      const cv = await this.cvRepository.createCV(cvData, { session });

      // Create initial version
      await this._createVersion(
        cv.id,
        cv.userId,
        cv.content || {},
        CV_VERSION_NAMES.INITIAL,
        CV_VERSION_DESCRIPTIONS.INITIAL,
        CV_VERSION_CHANGE_TYPE.MANUAL,
        { session },
        true, // allowEmpty = true for initial version
      );

      logger.info('CV created successfully', { cvId: cv.id, userId: cv.userId });
      return cv;
    });
  }

  /**
   * Upload CV file and create CV record with automatic parsing
   *
   * @param {string} userId - User ID
   * @param {Object} file - Multipart file object
   * @param {string} customTitle - Optional custom title
   * @returns {Promise<Object>} CV and parsing job info
   */
  async createFromUpload(userId, file, customTitle = null) {
    let fileInfo = null;

    try {
      if (!file) {
        throw new ValidationError('No file uploaded', ERROR_CODES.VALIDATION_ERROR);
      }

      // 1. Store the file (Outside transaction as it's an external side effect)
      fileInfo = await this.fileService.storeFile(file);

      // 2. Create CV record and initial version atomically
      const cv = await transactionManager.executeAtomic(async (session) => {
        const title = customTitle || file.originalname.replace(/\.[^/.]+$/, '');

        const cvData = {
          title,
          userId,
          source: CV_SOURCE.UPLOAD,
          metadata: {
            originalFilename: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: fileInfo.key,
            s3Key: fileInfo.s3Key,
            uploadedAt: new Date(),
          },
        };

        return await this.cvRepository.createCV(cvData, { session });
      });

      // 3. Start parsing job (Background operation)
      let parsingJob = null;
      try {
        if (this.cvParsingService) {
          parsingJob = await this.cvParsingService.startParsing(userId, cv.id, {});
        }
      } catch (parseError) {
        logger.warn('Failed to start parsing after upload', {
          error: parseError.message,
          cvId: cv.id
        });
      }

      return {
        cv,
        parsing: parsingJob ? {
          jobId: parsingJob.jobId,
          status: parsingJob.status,
        } : null,
      };
    } catch (error) {
      // Rollback file upload if storage succeeded but record creation failed
      if (fileInfo && fileInfo.s3Key) {
        try {
          await this.fileService.deleteFile(fileInfo.s3Key);
          logger.info('Rolled back file upload due to service failure', { s3Key: fileInfo.s3Key });
        } catch (deleteError) {
          logger.error('Failed to rollback file upload', {
            error: deleteError.message,
            s3Key: fileInfo.s3Key
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update CV
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<CV>} Updated CV
   */
  async updateCV(cvId, userId, updates) {
    return await transactionManager.executeAtomic(async (session) => {
      // Get current CV
      const currentCV = await this.cvRepository.getCVById(cvId, userId);
      if (!currentCV) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      // Validate updates
      this._validateCVUpdates(updates);

      // Create version before updating (if content changed)
      if (updates.content && this._hasValidContent(currentCV.content)) {
        const contentChanged = JSON.stringify(currentCV.content) !== JSON.stringify(updates.content);

        if (contentChanged) {
          await this._createVersion(
            cvId,
            userId,
            currentCV.content,
            CV_VERSION_NAMES.CONTENT_UPDATED,
            CV_VERSION_DESCRIPTIONS.CONTENT_UPDATED,
            CV_VERSION_CHANGE_TYPE.MANUAL,
            session ? { session } : {},
            false,
          );
        }
      }

      // Calculate metadata if content is being updated
      if (updates.content) {
        updates.metadata = updates.metadata || {};
        updates.metadata.wordCount = this._calculateWordCount(updates.content);
        updates.metadata.sectionCount = this._calculateSectionCount(updates.content);
      }

      // Update CV
      const updatedCV = await this.cvRepository.updateCV(cvId, userId, updates, { session });

      logger.info('CV updated successfully', { cvId, userId });
      return updatedCV;
    });
  }

  /**
   * Delete CV
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteCV(cvId, userId) {
    try {
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      await this.cvRepository.deleteCV(cvId, userId);

      logger.info('CV deleted', { cvId, userId });
    } catch (error) {
      logger.error('CV deletion failed', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Duplicate CV
   *
   * @param {string} cvId - Original CV ID
   * @param {string} userId - User ID
   * @param {string} newTitle - New CV title
   * @returns {Promise<CV>} Duplicated CV
   */
  async duplicateCV(cvId, userId, newTitle) {
    return await transactionManager.executeAtomic(async (session) => {
      const duplicatedCV = await this.cvRepository.duplicateCV(cvId, userId, newTitle, { session });

      // Create initial version for duplicated CV
      await this._createVersion(
        duplicatedCV.id,
        userId,
        duplicatedCV.content || {},
        CV_VERSION_NAMES.DUPLICATED,
        CV_VERSION_DESCRIPTIONS.DUPLICATED,
        CV_VERSION_CHANGE_TYPE.MANUAL,
        { session },
        true
      );

      logger.info('CV duplicated successfully', { originalId: cvId, newId: duplicatedCV.id, userId });
      return duplicatedCV;
    });
  }

  /**
   * Archive CV
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @returns {Promise<CV>} Archived CV
   */
  async archiveCV(cvId, userId) {
    try {
      return await this.cvRepository.updateCV(cvId, userId, { status: CV_ENTITY_STATUS.ARCHIVED });
    } catch (error) {
      logger.error('CV archiving failed', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Publish CV (make public)
   *
   * @param {string} cvId - CV ID
   * @param {string} userId - User ID
   * @returns {Promise<CV>} Published CV
   */
  async publishCV(cvId, userId) {
    try {
      const publicUrl = this._generatePublicUrl(cvId);

      return await this.cvRepository.updateCV(cvId, userId, {
        'metadata.isPublic': true,
        'metadata.publicUrl': publicUrl,
      });
    } catch (error) {
      logger.error('CV publishing failed', { error: error.message, cvId, userId });
      throw error;
    }
  }

  /**
   * Bulk operations on CVs with proper batching
   *
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @param {Array<string>} cvIds - CV IDs
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Operation result
   */
  async bulkOperation(userId, operation, cvIds, params = {}) {
    try {
      const results = [];
      const errors = [];
      const BATCH_SIZE = CV_BULK_OPERATIONS.BATCH_SIZE;

      // Process in batches to prevent memory issues
      for (let i = 0; i < cvIds.length; i += BATCH_SIZE) {
        const batch = cvIds.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (cvId) => {
          try {
            let result;
            switch (operation) {
              case 'archive':
                result = await this.archiveCV(cvId, userId);
                break;
              case 'delete':
                await this.deleteCV(cvId, userId);
                result = { cvId, status: CV_ENTITY_STATUS.DELETED };
                break;
              case 'publish':
                result = await this.publishCV(cvId, userId);
                break;
              default:
                throw new ValidationError(`Unsupported operation: ${operation}`, ERROR_CODES.VALIDATION_ERROR);
            }
            return { success: true, result };
          } catch (error) {
            return { success: false, cvId, error: error.message };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              results.push(result.value.result);
            } else {
              errors.push({ cvId: result.value.cvId, error: result.value.error });
            }
          } else {
            errors.push({ error: result.reason.message });
          }
        });
      }

      return {
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      };
    } catch (error) {
      logger.error('Bulk CV operation failed', {
        error: error.message,
        operation,
        count: cvIds.length,
        userId,
      });
      throw error;
    }
  }

  /**
   * Create a new version of CV with proper locking
   *
   * @private
   */
  async _createVersion(cvId, userId, content, name, description, changeType, options = {}, allowEmpty = false) {
    try {
      this._validateContent(content, allowEmpty);

      // Use atomic findOneAndUpdate to get latest version number safely
      const latestVersion = await this.cvVersionRepository.getLatestVersionNumber(cvId, options);
      const versionNumber = latestVersion + 1;

      return await this.cvVersionRepository.createVersion({
        cvId,
        versionNumber,
        userId,
        name: name || CV_VERSION_NAMES.INITIAL,
        description: description || name,
        content,
        changeType,
        metadata: {
          wordCount: this._calculateWordCount(content),
          sectionCount: this._calculateSectionCount(content),
        },
      }, options);
    } catch (error) {
      logger.error('Version creation failed', { error: error.message, cvId });
      throw error;
    }
  }

  /**
   * Check if content is valid and non-empty
   *
   * @private
   */
  _hasValidContent(content) {
    if (!content || typeof content !== 'object') {
      return false;
    }

    // Check if object has any non-empty values
    const hasContent = Object.values(content).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    });

    return hasContent;
  }

  /**
   * Validate CV data
   *
   * @private
   */
  _validateCVData(data) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw ErrorFactory.validationFailed('CV title is required and must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!data.userId) {
      throw ErrorFactory.validationFailed('User ID is required', ERROR_CODES.MISSING_USER_ID);
    }
  }

  /**
   * Validate CV updates
   *
   * @private
   */
  _validateCVUpdates(updates) {
    const allowedFields = [
      'title', 'description', 'tags', 'content', 'status',
      'metadata', 'settings', 'template',
    ];

    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      throw ErrorFactory.validationFailed(`Invalid update fields: ${invalidFields.join(', ')}`, ERROR_CODES.VALIDATION_ERROR);
    }

    // Prevent status change to DELETED through update
    if (updates.status === CV_ENTITY_STATUS.DELETED) {
      throw ErrorFactory.validationFailed('Cannot set status to deleted through update. Use delete endpoint.', ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Validate content structure
   *
   * @private
   */
  _validateContent(content, allowEmpty = false) {
    if (!content || typeof content !== 'object') {
      throw ErrorFactory.validationFailed('Content must be a valid object', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!allowEmpty && !this._hasValidContent(content)) {
      throw ErrorFactory.validationFailed('Content cannot be empty', ERROR_CODES.VALIDATION_ERROR);
    }
  }

  /**
   * Calculate word count from CV content
   *
   * @private
   */
  _calculateWordCount(content) {
    if (!content) return 0;

    const text = JSON.stringify(content);
    const words = text.match(/\b\w+\b/g);
    return words ? words.length : 0;
  }

  /**
   * Calculate section count from CV content
   *
   * @private
   */
  _calculateSectionCount(content) {
    if (!content) return 0;

    const sections = CV_CONTENT_SECTIONS;

    return sections.reduce((count, section) => {
      const sectionData = content[section];
      if (!sectionData) return count;

      if (Array.isArray(sectionData)) {
        return count + (sectionData.length > 0 ? 1 : 0);
      }

      if (typeof sectionData === 'object' && Object.keys(sectionData).length > 0) {
        return count + 1;
      }

      return count;
    }, 0);
  }

  /**
   * Generate public URL for CV
   *
   * @private
   */
  _generatePublicUrl(cvId) {
    const shortId = cvId.toString().slice(-CV_PUBLIC_URL.SHORT_ID_LENGTH);
    return `${CV_PUBLIC_URL.BASE_URL}/${shortId}`;
  }

  // Pass-through methods
  async getUserCVs(userId, options = {}) {
    return await this.cvRepository.getUserCVs(userId, options);
  }

  async searchCVs(userId, searchOptions = {}) {
    return await this.cvRepository.searchCVs(userId, searchOptions);
  }

  async getCVById(cvId, userId) {
    return await this.cvRepository.getCVById(cvId, userId);
  }

  async getCVStats(userId) {
    return await this.cvRepository.getCVStats(userId);
  }


}

module.exports = CVService;