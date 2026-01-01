/**
 * AI VALIDATOR
 * 
 * Validates AI-related inputs and operations
 * 
 * @module shared/external/ai/core/AIValidator
 */

const { ValidationError } = require('@errors');
const { ERROR_CODES, STRING_LIMITS } = require('@constants');

class AIValidator {
  constructor(config) {
    this.config = config;
    // Use a reasonable default for message length (100KB)
    this.maxMessageLength = config?.ai?.limits?.maxMessageLength || 100 * 1024;
    this.maxMessages = config?.ai?.limits?.maxMessages || 100;
  }

  /**
   * Validate messages array
   * @param {Array} messages - Messages array
   * @throws {ValidationError} If messages are invalid
   */
  validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new ValidationError('Messages must be an array', ERROR_CODES.VALIDATION_ERROR);
    }

    if (messages.length === 0) {
      throw new ValidationError('Messages array cannot be empty', ERROR_CODES.VALIDATION_ERROR);
    }

    if (messages.length > this.maxMessages) {
      throw new ValidationError(
        `Messages array exceeds maximum of ${this.maxMessages} messages`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    for (const message of messages) {
      if (!message || typeof message !== 'object') {
        throw new ValidationError('Each message must be an object', ERROR_CODES.VALIDATION_ERROR);
      }

      if (!message.role || typeof message.role !== 'string') {
        throw new ValidationError('Message must have a valid role', ERROR_CODES.VALIDATION_ERROR);
      }

      if (!message.content || typeof message.content !== 'string') {
        throw new ValidationError('Message must have a valid content string', ERROR_CODES.VALIDATION_ERROR);
      }

      if (message.content.length > this.maxMessageLength) {
        throw new ValidationError(
          `Message content exceeds maximum length of ${this.maxMessageLength} characters`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }
  }

  /**
   * Validate AI options
   * @param {Object} options - AI options (can be empty object)
   * @throws {ValidationError} If options are invalid
   */
  validateOptions(options) {
    // Allow empty object or undefined (defaults to {})
    if (options === null || (options !== undefined && typeof options !== 'object')) {
      throw new ValidationError('Options must be an object or undefined', ERROR_CODES.VALIDATION_ERROR);
    }

    // If undefined, treat as empty object
    if (options === undefined) {
      return;
    }

    if (options.temperature !== undefined) {
      if (typeof options.temperature !== 'number' || options.temperature < 0 || options.temperature > 2) {
        throw new ValidationError('Temperature must be a number between 0 and 2', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    if (options.maxTokens !== undefined) {
      if (typeof options.maxTokens !== 'number' || options.maxTokens < 1 || options.maxTokens > 100000) {
        throw new ValidationError('maxTokens must be a number between 1 and 100000', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    if (options.timeout !== undefined) {
      if (typeof options.timeout !== 'number' || options.timeout < 1000 || options.timeout > 300000) {
        throw new ValidationError('Timeout must be a number between 1000 and 300000 milliseconds', ERROR_CODES.VALIDATION_ERROR);
      }
    }
  }

  /**
   * Validate response text
   * @param {string} responseText - AI response text
   * @throws {ValidationError} If response is invalid
   */
  validateResponse(responseText) {
    if (responseText === null || responseText === undefined) {
      throw new ValidationError('AI response cannot be null or undefined', ERROR_CODES.VALIDATION_ERROR);
    }

    if (typeof responseText !== 'string') {
      throw new ValidationError('AI response must be a string', ERROR_CODES.VALIDATION_ERROR);
    }

    if (responseText.length === 0) {
      throw new ValidationError('AI response cannot be empty', ERROR_CODES.VALIDATION_ERROR);
    }
  }
}

module.exports = AIValidator;

