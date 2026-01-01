/**
 * STORAGE PROVIDER FACTORY
 * 
 * Factory for creating and managing storage providers
 * 
 * @module shared/external/storage/StorageProviderFactory
 */

const LocalStorageProvider = require('./providers/LocalStorageProvider');
const { STORAGE_TYPES, ERROR_CODES } = require('@constants');
const { ValidationError } = require('@errors');

class StorageProviderFactory {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.providers = new Map();
    this.defaultType = config.default || STORAGE_TYPES.LOCAL;
  }

  /**
   * Create a new provider instance
   * @param {string} type - Provider type (local, s3)
   * @returns {IStorageProvider} Provider instance
   */
  createProvider(type) {
    switch (type) {
      case STORAGE_TYPES.LOCAL:
        return new LocalStorageProvider(this.config.local || {}, this.logger);

      case STORAGE_TYPES.S3:
        // Lazy-load S3StorageProvider only when needed to avoid AWS SDK dependency issues
        const S3StorageProvider = require('./providers/S3StorageProvider');
        return new S3StorageProvider(this.config.s3 || {}, this.logger);

      default:
        throw new ValidationError(`Unknown storage provider: ${type}`, ERROR_CODES.CONFIGURATION_ERROR);
    }
  }

  /**
   * Get provider instance (cached)
   * @param {string} type - Provider type (optional, uses default if not provided)
   * @returns {IStorageProvider} Provider instance
   */
  getProvider(type = this.defaultType) {
    if (!this.providers.has(type)) {
      this.providers.set(type, this.createProvider(type));
    }
    return this.providers.get(type);
  }

  /**
   * Get all configured providers
   * @returns {Array<IStorageProvider>} Array of provider instances
   */
  getAllProviders() {
    const types = [];

    if (this.config.local) {
      types.push(STORAGE_TYPES.LOCAL);
    }

    if (this.config.s3 && this.config.s3.accessKeyId) {
      types.push(STORAGE_TYPES.S3);
    }

    return types.map(type => this.getProvider(type));
  }

  /**
   * Clear provider cache
   */
  clearCache() {
    this.providers.clear();
  }

  /**
   * Create factory from environment configuration
   * @static
   * @param {Object} config - App configuration
   * @param {Object} logger - Logger instance
   * @returns {StorageProviderFactory} Factory instance
   */
  static createFromEnv(config, logger) {
    const factoryConfig = {
      default: config.storage?.type || STORAGE_TYPES.LOCAL,
    };

    // Add local config if available
    if (config.storage?.local) {
      factoryConfig.local = {
        basePath: config.storage.local.uploadPath,
        baseUrl: config.storage.local.baseUrl,
      };
    }

    // Add S3 config if available
    if (config.storage?.s3) {
      factoryConfig.s3 = {
        region: config.storage.s3.region,
        bucket: config.storage.s3.bucketName,
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
        maxRetries: 3,
        defaultExpiration: config.storage.s3.signedUrlExpiry || 3600,
      };
    }

    return new StorageProviderFactory(factoryConfig, logger);
  }
}

module.exports = StorageProviderFactory;

