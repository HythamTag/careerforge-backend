const EnvironmentLoader = require('./env-loader');

/**
 * ENVIRONMENT VALIDATION
 *
 * Validates environment variables without mutating process.env.
 * Uses the centralized EnvironmentLoader for all variable access.
 */

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
];

const VALID_AI_PROVIDERS = ['openai', 'anthropic', 'gemini', 'huggingface', 'ollama', 'mock'];
const VALID_STORAGE_TYPES = ['local', 's3', 'both'];

const AI_PROVIDER_KEYS = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  huggingface: 'HUGGINGFACE_API_KEY',
  // Ollama doesn't require an API key - it's local
};

const S3_REQUIRED_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME',
];

class EnvironmentValidator {
  static validate() {
    const env = EnvironmentLoader.load();

    // Validate required variables
    this._validateRequiredVars(env);

    // Validate AI provider configuration
    this._validateAIProvider(env);

    // Validate storage configuration
    this._validateStorageConfig(env);

    // Validate numeric values
    this._validateNumericValues(env);

    // Validate URLs and connections
    this._validateConnections(env);

    return true;
  }

  static _validateRequiredVars(env) {
    const missing = REQUIRED_ENV_VARS.filter(varName => !env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file or environment configuration.',
      );
    }

    // Validate JWT_SECRET is secure (not empty)
    if (!env.JWT_SECRET || env.JWT_SECRET.trim() === '') {
      throw new Error(
        'JWT_SECRET is required and cannot be empty.\n' +
        'Please set a secure JWT_SECRET in your .env file.',
      );
    }
  }

  static _validateAIProvider(env) {
    if (!VALID_AI_PROVIDERS.includes(env.AI_PROVIDER)) {
      throw new Error(
        `Invalid AI_PROVIDER: '${env.AI_PROVIDER}'. ` +
        `Must be one of: ${VALID_AI_PROVIDERS.join(', ')}`,
      );
    }

    const requiredKey = AI_PROVIDER_KEYS[env.AI_PROVIDER];
    if (requiredKey && !env[requiredKey]) {
      throw new Error(
        `${requiredKey} is required when AI_PROVIDER is '${env.AI_PROVIDER}'.\n` +
        `Please set the ${requiredKey} environment variable.`,
      );
    }
  }

  static _validateStorageConfig(env) {
    if (!VALID_STORAGE_TYPES.includes(env.STORAGE_TYPE)) {
      throw new Error(
        `Invalid STORAGE_TYPE: '${env.STORAGE_TYPE}'. ` +
        `Must be one of: ${VALID_STORAGE_TYPES.join(', ')}`,
      );
    }

    if (['s3', 'both'].includes(env.STORAGE_TYPE)) {
      const missing = S3_REQUIRED_VARS.filter(varName => !env[varName]);
      if (missing.length > 0) {
        throw new Error(
          `Missing S3 configuration variables: ${missing.join(', ')}\n` +
          `These are required when STORAGE_TYPE is '${env.STORAGE_TYPE}'.`,
        );
      }
    }
  }

  static _validateNumericValues(env) {
    const numericVars = {
      PORT: env.PORT,
      REDIS_PORT: env.REDIS_PORT,
      MAX_FILE_SIZE: env.MAX_FILE_SIZE,
      MAX_PAGES: env.MAX_PAGES,
      RATE_LIMIT_UPLOADS: env.RATE_LIMIT_UPLOADS,
    };

    for (const [varName, value] of Object.entries(numericVars)) {
      if (isNaN(value) || value <= 0) {
        throw new Error(
          `Invalid ${varName}: '${value}'. Must be a positive number.`,
        );
      }
    }

    // Validate temperature ranges
    if (env.AI_TEMPERATURE_PARSER < 0 || env.AI_TEMPERATURE_PARSER > 2) {
      throw new Error(
        `Invalid AI_TEMPERATURE_PARSER: '${env.AI_TEMPERATURE_PARSER}'. ` +
        'Must be between 0 and 2.',
      );
    }

    if (env.AI_TEMPERATURE_OPTIMIZER < 0 || env.AI_TEMPERATURE_OPTIMIZER > 2) {
      throw new Error(
        `Invalid AI_TEMPERATURE_OPTIMIZER: '${env.AI_TEMPERATURE_OPTIMIZER}'. ` +
        'Must be between 0 and 2.',
      );
    }
  }

  static _validateConnections(env) {
    // Validate MongoDB URI format
    if (!env.MONGODB_URI.startsWith('mongodb://') &&
      !env.MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error(
        'Invalid MONGODB_URI format. Must start with \'mongodb://\' or \'mongodb+srv://\'',
      );
    }

    // Validate port ranges
    if (env.PORT < 1 || env.PORT > 65535) {
      throw new Error(`Invalid PORT: '${env.PORT}'. Must be between 1 and 65535.`);
    }

    if (env.REDIS_PORT < 1 || env.REDIS_PORT > 65535) {
      throw new Error(`Invalid REDIS_PORT: '${env.REDIS_PORT}'. Must be between 1 and 65535.`);
    }
  }

  static getValidationSummary() {
    const env = EnvironmentLoader.load();
    return {
      aiProvider: env.AI_PROVIDER,
      storageType: env.STORAGE_TYPE,
      hasRequiredKeys: this._checkRequiredKeys(env),
      configurationValid: true,
    };
  }

  static _checkRequiredKeys(env) {
    const provider = env.AI_PROVIDER;
    const requiredKey = AI_PROVIDER_KEYS[provider];
    return requiredKey ? !!env[requiredKey] : true;
  }
}

function validateEnv() {
  try {
    return EnvironmentValidator.validate();
  } catch (error) {
    // Log error without requiring logger import (circular dependency)
    console.error('❌ Environment validation failed:', error.message);
    throw error;
  }
}

module.exports = {
  validateEnv,
  EnvironmentValidator,
  AI_PROVIDER_KEYS,
  VALID_AI_PROVIDERS,
  VALID_STORAGE_TYPES,
};
