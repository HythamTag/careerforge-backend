/**
 * STORAGE SERVICE (Facade)
 * 
 * High-level storage operations facade
 * Orchestrates storage providers and adds business logic
 * 
 * @module shared/external/storage/StorageService
 */

const { StorageError } = require('@errors');
const { STORAGE_TYPES } = require('@constants');

class StorageService {
  constructor(providerFactory, validator, logger) {
    this.factory = providerFactory;
    this.validator = validator;
    this.logger = logger;
  }

  /**
   * Upload file with automatic provider selection
   * @param {Buffer} data - File data
   * @param {string} key - Storage key/path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(data, key, options = {}) {
    // Validate file size
    this.validator.validateFileSize(data.length);

    // Validate file type
    if (options.contentType) {
      this.validator.validateMimeType(options.contentType);
    }

    // Validate key
    this.validator.validateKey(key);

    const providerType = options.provider || this.factory.defaultType;
    const provider = this.factory.getProvider(providerType);

    return await provider.upload(data, key, options);
  }

  /**
   * Download file with automatic provider detection
   * @param {string} key - Storage key/path
   * @param {string} providerType - Provider type (optional)
   * @returns {Promise<Buffer>} File data
   */
  async downloadFile(key, providerType) {
    this.validator.validateKey(key);

    const provider = this.factory.getProvider(providerType || this.factory.defaultType);
    return await provider.download(key);
  }

  /**
   * Delete file from all configured providers
   * Supports multiple signatures:
   * - deleteFile(key) - Delete by storage key
   * - deleteFile(filePath, s3Key) - Legacy: delete from both local and S3 (both params are paths/keys)
   * - deleteFile(fileName, prefix) - Delete with prefix (e.g., fileName='file.pdf', prefix='avatars')
   * @param {string} key - Storage key/path (or filePath for legacy, or fileName for prefix pattern)
   * @param {string} secondParam - S3 key (legacy) or prefix (user.service pattern) or undefined
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(key, secondParam) {
    // Handle legacy API: deleteFile(filePath, s3Key)
    // Both params are file paths/keys (not a simple prefix)
    if (secondParam !== undefined) {
      const path = require('path');
      const isFilePath = key.includes(path.sep) || key.startsWith('./') || path.isAbsolute(key);
      const isSecondParamPath = secondParam.includes('/') || secondParam.includes(path.sep);

      // Legacy pattern: deleteFile(filePath, s3Key) - both are paths
      if (isFilePath && isSecondParamPath) {
        return this.deleteFileLegacy(key, secondParam);
      }

      // Prefix pattern: deleteFile(fileName, 'avatars')
      // secondParam is a simple prefix (no slashes, short string)
      if (secondParam && !isSecondParamPath && secondParam.length < 50) {
        key = `${secondParam}/${key}`;
      } else if (secondParam && isSecondParamPath) {
        // If secondParam looks like a path but first isn't, treat secondParam as the key
        key = secondParam;
      }
    }

    // New API: validate and delete by key
    this.validator.validateKey(key);

    const providers = this.factory.getAllProviders();

    // If no providers configured, return true (nothing to delete)
    if (providers.length === 0) {
      this.logger.warn('No storage providers configured for deletion', {
        operation: 'StorageDelete',
        key,
      });
      return true;
    }

    const results = await Promise.allSettled(
      providers.map(p => p.delete(key))
    );

    const allSucceeded = results.every(r => r.status === 'fulfilled');

    if (!allSucceeded) {
      const failures = results.filter(r => r.status === 'rejected');
      this.logger.warn('Some providers failed to delete file', {
        operation: 'StorageDelete',
        key,
        failures: failures.map(f => f.reason.message),
      });
    }

    return allSucceeded;
  }

  /**
   * Internal method to delete by key only (no legacy support)
   * @private
   */
  async _deleteByKey(key) {
    this.validator.validateKey(key);

    const providers = this.factory.getAllProviders();
    const results = await Promise.allSettled(
      providers.map(p => p.delete(key))
    );

    const allSucceeded = results.every(r => r.status === 'fulfilled');

    if (!allSucceeded) {
      const failures = results.filter(r => r.status === 'rejected');
      this.logger.warn('Some providers failed to delete file', {
        operation: 'StorageDelete',
        key,
        failures: failures.map(f => f.reason.message),
      });
    }

    return allSucceeded;
  }

  /**
   * Generate temporary download URL
   * @param {string} key - Storage key/path
   * @param {string} providerType - Provider type (optional)
   * @param {number} expiresIn - Expiration in seconds
   * @returns {Promise<string>} Signed URL
   */
  async generateDownloadUrl(key, providerType, expiresIn = 3600) {
    this.validator.validateKey(key);

    const provider = this.factory.getProvider(providerType || this.factory.defaultType);
    return await provider.getSignedUrl(key, expiresIn);
  }

  /**
   * Copy file between providers
   * @param {string} sourceProvider - Source provider type
   * @param {string} destProvider - Destination provider type
   * @param {string} key - Storage key/path
   * @returns {Promise<Object>} Copy result
   */
  async copyBetweenProviders(sourceProvider, destProvider, key) {
    this.validator.validateKey(key);

    const source = this.factory.getProvider(sourceProvider);
    const dest = this.factory.getProvider(destProvider);

    const data = await source.download(key);
    const metadata = await source.getMetadata(key);

    return await dest.upload(data, key, {
      contentType: metadata.contentType,
    });
  }

  /**
   * Check if file exists
   * @param {string} key - Storage key/path
   * @param {string} providerType - Provider type (optional)
   * @returns {Promise<boolean>} Exists status
   */
  async fileExists(key, providerType) {
    this.validator.validateKey(key);

    const provider = this.factory.getProvider(providerType || this.factory.defaultType);
    return await provider.exists(key);
  }

  /**
   * Get file metadata
   * @param {string} key - Storage key/path
   * @param {string} providerType - Provider type (optional)
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(key, providerType) {
    this.validator.validateKey(key);

    const provider = this.factory.getProvider(providerType || this.factory.defaultType);
    return await provider.getMetadata(key);
  }

  /**
   * Health check for all providers
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    const providers = this.factory.getAllProviders();
    const results = {};

    // If no providers configured, return unhealthy
    if (providers.length === 0) {
      return {
        healthy: false,
        providers: {},
        error: 'No storage providers configured',
      };
    }

    for (const provider of providers) {
      const providerName = provider.constructor.name;
      try {
        // Try to list files as health check
        await provider.list('', { limit: 1 });
        results[providerName] = { healthy: true };
      } catch (error) {
        results[providerName] = {
          healthy: false,
          error: error.message,
        };
      }
    }

    return {
      healthy: Object.values(results).every(r => r.healthy),
      providers: results,
    };
  }

  // Legacy methods for backward compatibility

  /**
   * Legacy: Store file (backward compatibility)
   * @param {Object} file - File object with path, originalname, mimetype, size
   * @returns {Promise<Object>} Storage result
   */
  async storeFile(file) {
    const fs = require('fs').promises;
    const fileBuffer = await fs.readFile(file.path);

    const key = `cv/${Date.now()}-${file.originalname}`;

    const result = await this.uploadFile(fileBuffer, key, {
      contentType: file.mimetype,
    });

    // Clean up local file if using S3 only
    const storageType = this.factory.defaultType;
    if (storageType === STORAGE_TYPES.S3) {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        this.logger.warn('Failed to delete local file after S3 upload', {
          operation: 'StorageStoreFile',
          path: file.path,
          error: error.message,
        });
      }
    }

    return {
      ...result,
      key,  // Storage key for the file (e.g., 'cv/timestamp-filename.pdf')
      storedAt: new Date(),
    };
  }

  /**
   * Legacy: Get file (backward compatibility)
   * @param {string} filePath - Local file path (optional)
   * @param {string} s3Key - S3 key (optional)
   * @returns {Promise<Buffer>} File data
   */
  async getFile(filePath, s3Key) {
    if (s3Key) {
      return await this.downloadFile(s3Key, STORAGE_TYPES.S3);
    } else if (filePath) {
      // For local files, try to read directly from filesystem
      // This maintains backward compatibility with existing code
      const fs = require('fs').promises;
      try {
        return await fs.readFile(filePath);
      } catch (error) {
        // If direct read fails, try to extract key and use provider
        const path = require('path');
        const config = require('@config');
        const basePath = config.storage?.local?.uploadPath || './uploads';
        const relativePath = path.relative(basePath, filePath);
        if (relativePath && !relativePath.startsWith('..')) {
          return await this.downloadFile(relativePath, STORAGE_TYPES.LOCAL);
        }
        throw new StorageError(`File not found: ${filePath}`);
      }
    } else {
      throw new StorageError('No file path or S3 key provided');
    }
  }

  /**
   * Legacy: Delete file (backward compatibility)
   * @param {string} filePath - Local file path (optional)
   * @param {string} s3Key - S3 key (optional)
   * @returns {Promise<boolean>} Success status
   */
  async deleteFileLegacy(filePath, s3Key) {
    let s3Deleted = true;
    let localDeleted = true;

    // Delete from S3 if s3Key provided
    if (s3Key) {
      try {
        const s3Provider = this.factory.getProvider(STORAGE_TYPES.S3);
        this.validator.validateKey(s3Key);
        s3Deleted = await s3Provider.delete(s3Key);
      } catch (error) {
        this.logger.warn('Failed to delete from S3 in legacy mode', {
          operation: 'StorageDeleteLegacy',
          s3Key,
          error: error.message,
        });
        s3Deleted = false;
      }
    }

    // Delete from local if filePath provided
    if (filePath) {
      // Try direct delete first for backward compatibility
      const fs = require('fs').promises;
      try {
        await fs.unlink(filePath);
        localDeleted = true;
      } catch (error) {
        // If direct delete fails, try using local provider
        try {
          const path = require('path');
          const config = require('@config');
          const basePath = config.storage?.local?.uploadPath || './uploads';
          const relativePath = path.relative(basePath, filePath);
          if (relativePath && !relativePath.startsWith('..')) {
            const localProvider = this.factory.getProvider(STORAGE_TYPES.LOCAL);
            this.validator.validateKey(relativePath);
            localDeleted = await localProvider.delete(relativePath);
          } else {
            localDeleted = false;
          }
        } catch (providerError) {
          this.logger.warn('Failed to delete from local storage in legacy mode', {
            operation: 'StorageDeleteLegacy',
            filePath,
            error: providerError.message,
          });
          localDeleted = false;
        }
      }
    }

    // Return true if all requested deletions succeeded
    // If no params provided, return true (nothing to delete)
    if (!s3Key && !filePath) {
      return true;
    }
    return s3Deleted && localDeleted;
  }
}

module.exports = StorageService;
