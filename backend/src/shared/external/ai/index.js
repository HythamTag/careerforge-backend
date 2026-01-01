/**
 * AI SERVICES MODULE
 * 
 * Production-ready AI services with dependency injection and SOLID principles
 * 
 * @module shared/external/ai
 */

const AIService = require('./services/AIService');
const AIProviderFactory = require('./factories/AIProviderFactory');
const AIProviderRegistry = require('./registry/AIProviderRegistry');
const JSONParser = require('./core/JSONParser');
const AIValidator = require('./core/AIValidator');
const IAIProvider = require('./interfaces/IAIProvider');
const OllamaSchemaTransformer = require('./core/OllamaSchemaTransformer');

// Legacy singleton support (deprecated - use container instead)
let aiServiceInstance = null;

/**
 * Get or create the AI service instance (legacy method).
 * @deprecated Use container.resolve('aiService') instead
 * @returns {AIService} AI service instance
 */
function getAIService() {
  if (!aiServiceInstance) {
    const { resolve } = require('@core/container');
    aiServiceInstance = resolve('aiService');
  }
  return aiServiceInstance;
}

/**
 * Reset the AI service instance (for testing).
 */
function resetAIService() {
  aiServiceInstance = null;
}

module.exports = {
  AIService,
  AIProviderFactory,
  AIProviderRegistry,
  JSONParser,
  AIValidator,
  IAIProvider,
  OllamaSchemaTransformer,
  // Legacy exports
  getAIService,
  resetAIService,
};
