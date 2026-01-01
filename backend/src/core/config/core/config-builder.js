const EnvironmentLoader = require('./env-loader');
const { validateEnv } = require('./env.validator');
const AIConfig = require('../modules/ai.config');
const DatabaseConfig = require('../modules/database.config');
const RedisConfig = require('../modules/redis.config');
const StorageConfig = require('../modules/storage.config');
const QueueConfig = require('../modules/queue.config');
const SecurityConfig = require('../modules/security.config');
const AppConfig = require('../modules/app.config');
const deepFreeze = require('../../utils/core/deep-freeze');

/**
 * Custom configuration error
 */
class ConfigurationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
    this.details = details;

    // Capture stack trace for better debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// JSDoc typedefs moved to types/config.types.js

/**
 * Configuration Builder
 * Builds immutable configuration from environment variables
 */
class ConfigBuilder {
  constructor() {
    this._config = null;
    this._built = false;
  }

  /**
   * Build and return deeply frozen configuration
   * @returns {AppConfiguration}
   */
  build() {
    if (this._built) {
      return this._config;
    }

    try {
      // Step 1: Validate environment
      validateEnv();

      // Step 2: Load environment variables
      const env = EnvironmentLoader.load();

      // Step 3: Build configuration from individual config modules
      const config = {
        // AI configuration
        ai: AIConfig.getConfig(env),

        // Database configuration
        database: DatabaseConfig.getConfig(env),

        // Redis configuration
        redis: RedisConfig.getConfig(env),

        // Storage configuration
        storage: StorageConfig.getConfig(env),

        // Job queue configuration
        jobQueue: QueueConfig.getConfig(env),

        // Security configuration
        security: SecurityConfig.getConfig(env),

        // Application configuration (spread to top level)
        ...AppConfig.getConfig(env),
      };

      // Step 4: Validate final configuration structure
      this._validateConfig(config);

      // Step 5: Deep freeze to ensure immutability
      this._config = deepFreeze(config);
      this._built = true;

      return this._config;
    } catch (error) {
      console.error('❌ Configuration build failed:', error.message);
      // Fallback logging if logger is not available yet due to circular dependency
      if (process.env.NODE_ENV !== 'test') {
        console.error(error.stack);
      }
      throw new ConfigurationError(
        'Failed to build configuration',
        'CONFIG_BUILD_FAILED',
        { originalError: error.message },
      );
    }
  }

  /**
   * Get current configuration (throws if not built)
   * @returns {AppConfiguration}
   */
  get() {
    if (!this._built) {
      throw new ConfigurationError(
        'Configuration not built. Call build() first.',
        'CONFIG_NOT_BUILT',
      );
    }
    return this._config;
  }

  /**
   * Reset configuration (for testing)
   */
  reset() {
    this._config = null;
    this._built = false;
  }

  /**
   * Validate final configuration structure
   * @private
   */
  _validateConfig(config) {
    const errors = [];

    // Validate required top-level properties
    const requiredProps = ['server', 'database', 'redis', 'ai', 'storage', 'security'];
    for (const prop of requiredProps) {
      if (!config[prop]) {
        errors.push(`Missing required configuration section: ${prop}`);
      }
    }

    // Validate server config
    if (config.server) {
      if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
        errors.push('Invalid server.port: must be between 1 and 65535');
      }
      if (!config.server.nodeEnv) {
        errors.push('Missing server.nodeEnv');
      }
    }

    // Validate database config
    if (config.database) {
      if (!config.database.mongodbUri) {
        errors.push('Missing database.mongodbUri');
      }
    }

    // Validate Redis config
    if (config.redis) {
      if (!config.redis.host) {
        errors.push('Missing redis.host');
      }
      if (!config.redis.port) {
        errors.push('Missing redis.port');
      }
    }

    // Validate AI config
    if (config.ai) {
      if (!config.ai.provider) {
        errors.push('Missing ai.provider');
      }
    }

    if (errors.length > 0) {
      throw new ConfigurationError(
        'Configuration validation failed',
        'CONFIG_VALIDATION_FAILED',
        { errors },
      );
    }
  }
}

module.exports = ConfigBuilder;


