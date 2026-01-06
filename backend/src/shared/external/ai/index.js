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

module.exports = {
  AIService,
  AIProviderFactory,
  AIProviderRegistry,
  JSONParser,
  AIValidator,
  IAIProvider,
  OllamaSchemaTransformer,
};
