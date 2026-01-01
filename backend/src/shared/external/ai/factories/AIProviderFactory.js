/**
 * AI PROVIDER FACTORY
 * 
 * Factory for creating AI provider instances.
 * Uses registry pattern for OCP compliance.
 * 
 * @module services/ai/AIProviderFactory
 */

const { defaultRegistry } = require('../registry/AIProviderRegistry');
const logger = require('@utils/logger');
const config = require('@config');
const { AppError, ValidationError } = require('@errors');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

class AIProviderFactory {
  /**
   * Create a provider instance by name.
   * 
   * @param {string} providerName - Provider identifier
   * @param {*} apiKeyOrOptions - API key string or options object
   * @returns {Object} Provider instance
   */
  static create(providerName, apiKeyOrOptions) {
    return defaultRegistry.createInstance(providerName, apiKeyOrOptions);
  }

  /**
   * Create provider from environment configuration.
   * Uses config as single source of truth.
   * 
   * @returns {Object} Configured provider instance
   */
  static createFromEnv() {
    const providerName = config.ai.provider;

    // Mock provider for testing
    if (providerName.toLowerCase() === 'mock') {
      return this._createMockProvider();
    }

    // Ollama (local, no API key)
    if (providerName.toLowerCase() === 'ollama') {
      return this._createOllamaProvider();
    }

    // Other providers require API keys
    return this._createAPIKeyProvider(providerName);
  }

  /**
   * Create mock provider for testing.
   * @private
   */
  static _createMockProvider() {
    const { MOCK_PROVIDER_DELAY_MS } = require('@constants');
    const provider = this.create('mock', { delay: MOCK_PROVIDER_DELAY_MS });
    logger.info('AI provider initialized', {
      operation: 'AI provider initialization',
      provider: provider.getName(),
      model: 'mock-model',
      note: 'Using mock provider for testing',
    });
    return provider;
  }

  /**
   * Create Ollama provider (local, no API key).
   * @private
   */
  static _createOllamaProvider() {
    if (!config.ai.ollama) {
      throw new AppError('Ollama configuration not found. Please check your .env file.', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONFIGURATION_ERROR);
    }

    const ollamaOptions = {
      host: config.ai.ollama.host,
      timeout: config.ai.ollama.timeout,
      model: config.ai.ollama.defaultModel,
    };

    const provider = this.create('ollama', ollamaOptions);
    logger.info('AI provider initialized', {
      operation: 'AI provider initialization',
      provider: provider.getName(),
      host: ollamaOptions.host,
      model: ollamaOptions.model,
    });
    return provider;
  }

  /**
   * Create API key provider (OpenAI, Anthropic, etc.).
   * @private
   */
  static _createAPIKeyProvider(providerName) {
    const apiKey = config.ai.apiKeys[providerName];
    if (!apiKey) {
      throw new ValidationError(`API key for ${providerName} is required`, ERROR_CODES.CONFIGURATION_ERROR);
    }

    const provider = this.create(providerName, apiKey);
    logger.info('AI provider initialized', {
      operation: 'AI provider initialization',
      provider: provider.getName(),
    });
    return provider;
  }

  /**
   * Get list of available providers.
   * 
   * @returns {string[]} Array of registered provider names
   */
  static getAvailableProviders() {
    return defaultRegistry.getAvailableProviders();
  }

  /**
   * Check if a provider is available.
   * 
   * @param {string} name - Provider name
   * @returns {boolean} True if provider is registered
   */
  static hasProvider(name) {
    return defaultRegistry.has(name);
  }
}

module.exports = AIProviderFactory;




