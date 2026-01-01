/**
 * BASE PARSER STRATEGY
 *
 * Abstract base class for CV parsing strategies.
 * All parsing algorithms must implement this interface.
 *
 * @module modules/cv-parsing/strategies/base-parser.strategy
 */

const { AppError } = require('@errors');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

class BaseParserStrategy {
  /**
     * Get the name of this parsing strategy
     */
  get name() {
    throw new AppError('Strategy must implement name getter', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.VALIDATION_ERROR);
  }

  /**
     * Get supported file types (mime types)
     */
  get supportedTypes() {
    throw new AppError('Strategy must implement supportedTypes getter', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.VALIDATION_ERROR);
  }

  /**
     * Check if this strategy can handle the given file type
     */
  canHandle(mimeType) {
    return this.supportedTypes.includes(mimeType);
  }

  /**
     * Parse CV content from file
     */
  async parse(filePath, options = {}) {
    throw new AppError('Strategy must implement parse method', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.VALIDATION_ERROR);
  }

  /**
     * Extract text content from parsed data
     */
  async extractText(parsedData) {
    throw new AppError('Strategy must implement extractText method', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.VALIDATION_ERROR);
  }

  /**
     * Validate parsing result
     */
  validateResult(result) {
    return result && result.content && result.content.length > 0;
  }
}

module.exports = BaseParserStrategy;
