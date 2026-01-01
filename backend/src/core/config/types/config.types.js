/**
 * @typedef {Object} ServerConfig
 * @property {string} host - Server hostname
 * @property {number} port - Server port (1-65535)
 * @property {string} nodeEnv - Node environment (development|production|test)
 * @property {boolean} isProduction - Whether running in production
 */

/**
 * @typedef {Object} DatabaseConfig
 * @property {string} mongodbUri - MongoDB connection URI
 * @property {string} dbName - Database name
 * @property {number} timeout - Connection timeout in ms
 * @property {number} maxPoolSize - Maximum connection pool size
 * @property {number} serverSelectionTimeout - Server selection timeout in ms
 * @property {number} socketTimeout - Socket timeout in ms
 * @property {number} bufferMaxEntries - Buffer max entries
 * @property {boolean} bufferCommands - Whether to buffer commands
 */

/**
 * @typedef {Object} RedisConfig
 * @property {string} host - Redis hostname
 * @property {number} port - Redis port
 * @property {string} [password] - Redis password (optional)
 * @property {number} db - Redis database number
 * @property {number} connectTimeout - Connection timeout in ms
 * @property {boolean} lazyConnect - Whether to use lazy connection
 * @property {number} retryDelayOnFailover - Retry delay on failover in ms
 * @property {number} maxRetriesPerRequest - Maximum retries per request
 */

/**
 * @typedef {Object} AIConfig
 * @property {string} provider - AI provider (openai|anthropic|gemini|huggingface|ollama)
 * @property {Object} limits - AI operation limits
 * @property {Object} models - AI model configurations
 * @property {Object} apiKeys - API keys for providers
 * @property {Object} ollama - Ollama-specific configuration
 */

/**
 * @typedef {Object} StorageConfig
 * @property {string} type - Storage type (local|s3)
 * @property {Object} local - Local storage configuration
 * @property {Object} s3 - S3 storage configuration
 */

/**
 * @typedef {Object} JobQueueConfig
 * @property {Object} default - Default queue settings
 * @property {Object} queues - Per-queue configurations
 */

/**
 * @typedef {Object} SecurityConfig
 * @property {string[]} corsAllowedOrigins - CORS allowed origins
 * @property {string} jwtSecret - JWT secret key
 * @property {string} jwtAccessTokenExpiry - JWT access token expiry
 * @property {string} jwtRefreshTokenExpiry - JWT refresh token expiry
 */

/**
 * @typedef {Object} AppConfiguration
 * @property {ServerConfig} server - Server configuration
 * @property {DatabaseConfig} database - Database configuration
 * @property {RedisConfig} redis - Redis configuration
 * @property {AIConfig} ai - AI configuration
 * @property {StorageConfig} storage - Storage configuration
 * @property {JobQueueConfig} jobQueue - Job queue configuration
 * @property {SecurityConfig} security - Security configuration
 */

module.exports = {};
