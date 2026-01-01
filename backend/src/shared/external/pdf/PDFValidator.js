/**
 * PDF VALIDATOR
 * 
 * Validates PDF files and operations
 * 
 * @module shared/external/pdf/PDFValidator
 */

const { ValidationError, FileError } = require('@errors');
const { FILE_LIMITS, ERROR_CODES } = require('@constants');

class PDFValidator {
  constructor(config) {
    this.config = config;
    this.maxPages = config?.fileLimits?.maxPages || FILE_LIMITS.MAX_PAGES_PER_DOCUMENT;
    this.maxSize = config?.fileLimits?.maxSize || FILE_LIMITS.MAX_FILE_SIZE;
  }

  /**
   * Validate PDF buffer
   * @param {Buffer} fileBuffer - PDF file buffer
   * @throws {ValidationError} If buffer is invalid
   */
  validateBuffer(fileBuffer) {
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new ValidationError('Input must be a Buffer', ERROR_CODES.VALIDATION_ERROR);
    }

    if (fileBuffer.length === 0) {
      throw new ValidationError('PDF buffer is empty', ERROR_CODES.VALIDATION_ERROR);
    }

    if (fileBuffer.length > this.maxSize) {
      throw new ValidationError(
        `PDF size exceeds maximum of ${this.maxSize} bytes`,
        ERROR_CODES.FILE_TOO_LARGE
      );
    }
  }

  /**
   * Validate PDF header
   * @param {Buffer} fileBuffer - PDF file buffer
   * @throws {ValidationError} If PDF header is invalid
   */
  validateHeader(fileBuffer) {
    const header = fileBuffer.slice(0, 5).toString('utf8');
    if (!header.startsWith('%PDF-')) {
      throw new ValidationError('Invalid PDF header', ERROR_CODES.CV_INVALID_FORMAT);
    }
  }

  /**
   * Validate page count
   * @param {number} pages - Number of pages
   * @throws {ValidationError} If page count exceeds limit
   */
  validatePageCount(pages) {
    if (pages > this.maxPages) {
      throw new ValidationError(
        `PDF page count (${pages}) exceeds maximum of ${this.maxPages} pages`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }
}

module.exports = PDFValidator;

