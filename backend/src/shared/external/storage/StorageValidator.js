/**
 * STORAGE VALIDATOR
 * 
 * Validates file operations for storage service
 * 
 * @module shared/external/storage/StorageValidator
 */

const { ValidationError } = require('@errors');
const { FILE_LIMITS, ALLOWED_MIME_TYPES, ERROR_CODES } = require('@constants');

class StorageValidator {
  constructor(config) {
    this.config = config;
    this.maxFileSize = config?.maxFileSize || FILE_LIMITS.MAX_FILE_SIZE;
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @throws {ValidationError} If file size exceeds limit
   */
  validateFileSize(size) {
    if (size <= 0) {
      throw new ValidationError('File size must be greater than zero', ERROR_CODES.VALIDATION_ERROR);
    }

    if (size > this.maxFileSize) {
      throw new ValidationError(
        `File size exceeds maximum of ${this.maxFileSize} bytes`,
        ERROR_CODES.FILE_TOO_LARGE
      );
    }
  }

  /**
   * Validate MIME type
   * @param {string} mimeType - MIME type to validate
   * @throws {ValidationError} If MIME type is not allowed
   */
  validateMimeType(mimeType) {
    if (!mimeType || typeof mimeType !== 'string') {
      throw new ValidationError('MIME type must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValidationError(
        `MIME type '${mimeType}' is not allowed`,
        ERROR_CODES.FILE_INVALID_TYPE
      );
    }
  }

  /**
   * Validate storage key
   * @param {string} key - Storage key to validate
   * @throws {ValidationError} If key is invalid
   */
  validateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Storage key must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    if (key.length > 1024) {
      throw new ValidationError('Storage key length exceeds maximum of 1024 characters', ERROR_CODES.VALIDATION_ERROR);
    }

    // Prevent directory traversal
    if (key.includes('..')) {
      throw new ValidationError('Invalid key: directory traversal not allowed', ERROR_CODES.VALIDATION_ERROR);
    }
  }
}

module.exports = StorageValidator;

