/**
 * AI PROVIDER REGISTRY
 * 
 * Registry pattern for AI providers following Open/Closed Principle.
 * New providers can be added without modifying existing code.
 * 
 * @module services/ai/AIProviderRegistry
 */

const logger = require('@utils/logger');

/**
 * Registry for AI provider classes.
 * Allows dynamic registration and retrieval of providers.
 */
class AIProviderRegistry {
  constructor() {
    this._providers = new Map();
  }

  /**
     * Register a provider class with a name.
     * 
     * @param {string} name - Provider identifier (e.g., 'ollama', 'openai')
     * @param {Function} ProviderClass - Provider class constructor
     */
  register(name, ProviderClass) {
    if (!name || typeof name !== 'string') {
      throw new Error('Provider name must be a non-empty string');
    }
    if (typeof ProviderClass !== 'function') {
      throw new Error('ProviderClass must be a constructor function');
    }

    const normalizedName = name.toLowerCase();
    this._providers.set(normalizedName, ProviderClass);

    logger.debug(`AI provider registered: ${normalizedName}`, {
      operation: 'Provider registration',
    });
  }

  /**
     * Get a provider class by name.
     * 
     * @param {string} name - Provider identifier
     * @returns {Function} Provider class constructor
     * @throws {Error} If provider not found
     */
  get(name) {
    const normalizedName = name.toLowerCase();
    const ProviderClass = this._providers.get(normalizedName);

    if (!ProviderClass) {
      const available = this.getAvailableProviders().join(', ');
      throw new Error(
        `AI provider '${name}' not found. Available providers: ${available}`,
      );
    }

    return ProviderClass;
  }

  /**
     * Check if a provider is registered.
     * 
     * @param {string} name - Provider identifier
     * @returns {boolean} True if registered
     */
  has(name) {
    return this._providers.has(name.toLowerCase());
  }

  /**
     * Get list of available provider names.
     * 
     * @returns {string[]} Array of registered provider names
     */
  getAvailableProviders() {
    return Array.from(this._providers.keys());
  }

  /**
     * Create a provider instance.
     * 
     * @param {string} name - Provider identifier
     * @param {*} options - Options to pass to provider constructor
     * @returns {Object} Provider instance
     */
  createInstance(name, options) {
    const ProviderClass = this.get(name);
    return new ProviderClass(options);
  }
}

// ============================================================================
// DEFAULT REGISTRY WITH BUILT-IN PROVIDERS
// ============================================================================

/**
 * Create and configure the default registry with all built-in providers.
 */
function createDefaultRegistry() {
  const registry = new AIProviderRegistry();

  // Register all built-in providers
  registry.register('openai', require('../providers/OpenAIProvider'));
  registry.register('anthropic', require('../providers/AnthropicProvider'));
  registry.register('gemini', require('../providers/GeminiProvider'));
  registry.register('huggingface', require('../providers/HuggingFaceProvider'));
  registry.register('ollama', require('../providers/OllamaProvider'));
  registry.register('mock', require('../providers/MockProvider'));

  return registry;
}

// Singleton default registry
const defaultRegistry = createDefaultRegistry();

module.exports = {
  AIProviderRegistry,
  defaultRegistry,
  createDefaultRegistry,
};




