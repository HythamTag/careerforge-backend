/**
 * AI SERVICE
 * 
 * High-level AI service abstraction.
 * Provides unified interface to AI providers with retry logic and validation.
 * 
 * @module shared/external/ai/services/AIService
 */

const JSONParser = require('../core/JSONParser');
const logger = require('@utils/logger');
const { AIError, AITimeoutError, ValidationError } = require('@errors');
const { STRING_LIMITS, ERROR_CODES } = require('@constants');

class AIService {
  /**
   * Create AI service with injected dependencies.
   * 
   * @param {Object} provider - AI provider instance
   * @param {Object} validator - AIValidator instance
   * @param {Function} jsonParser - JSONParser class (optional, defaults to JSONParser)
   * @param {Object} config - Configuration object (optional)
   */
  constructor(provider, validator, jsonParser = JSONParser, config = null) {
    if (!provider) {
      throw new ValidationError('Provider is required', ERROR_CODES.CONFIGURATION_ERROR);
    }
    if (!validator) {
      throw new ValidationError('Validator is required', ERROR_CODES.CONFIGURATION_ERROR);
    }
    
    this.provider = provider;
    this.validator = validator;
    this.jsonParser = jsonParser; // JSONParser class (has static methods)
    this.config = config;
    this.maxRetries = config?.ai?.retry?.maxRetries || 3;
    this.retryDelay = config?.ai?.retry?.baseDelay || 1000;
  }

  /**
   * Call AI provider with messages.
   * Includes retry logic with exponential backoff for operational errors.
   * 
   * @param {Array} messages - Messages array
   * @param {Object} options - AI options
   * @param {number} retryAttempt - Current retry attempt (internal use)
   * @returns {Promise<string>} AI response
   */
  async callAI(messages, options = {}, retryAttempt = 0) {
    // Validate inputs
    this.validator.validateMessages(messages);
    this.validator.validateOptions(options);

    const startTime = Date.now();
    const providerName = this.getProviderName();

    this._logAICall('started', {
      provider: providerName,
      messagesCount: messages.length,
      messageRoles: messages.map(m => m.role),
      options: {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        format: options.format,
      },
      retryAttempt,
    });

    try {
      const response = await this.provider.callAI(messages, options);
      const duration = Date.now() - startTime;

      // Validate response (throws if invalid)
      this.validator.validateResponse(response);

      this._logAICall('completed', {
        provider: providerName,
        duration: `${duration}ms`,
        responseLength: response.length,
        responsePreview: response.substring(0, STRING_LIMITS.AI_RESPONSE_PREVIEW_LENGTH) + (response.length > STRING_LIMITS.AI_RESPONSE_PREVIEW_LENGTH ? '...' : ''),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      this._logAICall('failed', {
        provider: providerName,
        duration: `${duration}ms`,
        errorType: error.constructor.name,
        errorMessage: error.message,
        retryAttempt,
        requestContext: {
          messagesCount: messages.length,
          firstMessagePreview: messages[0]?.content?.substring(0, STRING_LIMITS.AI_MESSAGE_PREVIEW_LENGTH),
          lastMessagePreview: messages[messages.length - 1]?.content?.substring(0, STRING_LIMITS.AI_MESSAGE_PREVIEW_LENGTH),
        },
      });

      // Retry logic for operational errors (excluding timeout errors)
      // Timeout errors are operational but shouldn't be retried immediately
      // as they'll likely timeout again without addressing the root cause
      const isTimeoutError = error instanceof AITimeoutError || error.name === 'AITimeoutError';
      const shouldRetry = error.isOperational && !isTimeoutError && retryAttempt < this.maxRetries;

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryAttempt);
        logger.warn('AI call failed, retrying', {
          provider: providerName,
          attempt: retryAttempt + 1,
          maxRetries: this.maxRetries,
          delay: `${delay}ms`,
          error: error.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callAI(messages, options, retryAttempt + 1);
      }

      // Re-throw operational errors as-is
      if (error.isOperational) {
        throw error;
      }

      // Wrap non-operational errors
      throw new AIError(`AI service error: ${error.message}`, ERROR_CODES.AI_SERVICE_ERROR);
    }
  }

  /**
   * Parse JSON response from AI.
   * Provider-specific transformations should be handled by the provider or middleware.
   * 
   * @param {string} responseText - Raw response text
   * @returns {Promise<Object>} Parsed JSON (kept async for backward compatibility)
   */
  async parseJSONResponse(responseText) {
    // Validate response text
    this.validator.validateResponse(responseText);

    try {
      // JSONParser.parse is static and synchronous, but we keep this async
      // for backward compatibility and future extensibility
      // Call static method on the class (jsonParser is the JSONParser class)
      const parsed = this.jsonParser.parse(responseText);

      logger.debug('JSON parsed successfully', {
        operation: 'AI parsing',
        provider: this.getProviderName(),
        keys: Object.keys(parsed),
      });

      return parsed;
    } catch (error) {
      logger.error('JSON parsing failed', {
        operation: 'AI parsing',
        provider: this.getProviderName(),
        error: error.message,
        responsePreview: responseText.substring(0, STRING_LIMITS.PREVIEW_MAX_LENGTH),
      });
      throw error;
    }
  }

  /**
   * Get provider name.
   * 
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.provider.getName();
  }

  /**
   * Generate a response from a prompt string.
   * Convenience wrapper around callAI for simple prompt->response flows.
   * 
   * @param {string} prompt - The prompt string
   * @param {Object} options - AI options (model, temperature, maxTokens)
   * @returns {Promise<Object>} Response object with content, model, tokensUsed
   */
  async generateResponse(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string') {
      throw new ValidationError('Prompt must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    const messages = [
      { role: 'user', content: prompt },
    ];

    // Request JSON format if prompt mentions JSON
    const requestFormat = prompt.toLowerCase().includes('json') ? 'json' : undefined;

    const response = await this.callAI(messages, {
      ...options,
      format: requestFormat,
    });

    return {
      content: response,
      model: options.model || this.provider?.model,
      tokensUsed: response?.length ? Math.ceil(response.length / 4) : 0, // Rough estimate
    };
  }

  /**
   * Log AI call events with structured data
   * @private
   * @param {string} phase - Call phase (started, completed, failed)
   * @param {Object} data - Additional log data
   */
  _logAICall(phase, data) {
    logger.info(`AI call ${phase}`, {
      operation: 'AICall',
      phase,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}

module.exports = AIService;




