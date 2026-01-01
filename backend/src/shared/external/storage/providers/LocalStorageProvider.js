/**
 * LOCAL STORAGE PROVIDER
 * 
 * Local filesystem implementation of IStorageProvider
 * 
 * @module shared/external/storage/providers/LocalStorageProvider
 */

const fs = require('fs').promises;
const path = require('path');
const IStorageProvider = require('../interfaces/IStorageProvider');
const { StorageError, ValidationError } = require('@errors');
const { ERROR_CODES } = require('@constants');

class LocalStorageProvider extends IStorageProvider {
  constructor(config, logger) {
    super();
    // Support both basePath (new) and uploadPath (legacy from config)
    const rawPath = config.basePath || config.uploadPath || './uploads';
    // Resolve to absolute path to avoid issues with working directory changes
    this.basePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    this.baseUrl = config.baseUrl || 'http://localhost:3000/files';
    this.logger = logger;
    
    // Log the resolved path for debugging
    this.logger.debug('LocalStorageProvider initialized', {
      operation: 'Storage initialization',
      basePath: this.basePath,
      rawPath: rawPath,
    });
  }

  async upload(data, key, options = {}) {
    this.validateKey(key);

    try {
      const fullPath = this.getFullPath(key);
      await this.ensureDirectory(path.dirname(fullPath));

      // Validate data before writing
      if (!data) {
        throw new StorageError('Cannot upload null/undefined data', ERROR_CODES.FILE_INVALID);
      }

      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (dataBuffer.length === 0) {
        throw new StorageError('Cannot upload empty file', ERROR_CODES.FILE_INVALID);
      }

      // Write buffer to file
      await fs.writeFile(fullPath, dataBuffer);

      const stats = await fs.stat(fullPath);
      
      // Verify file was written correctly
      if (stats.size === 0) {
        throw new StorageError('File was written but is empty', ERROR_CODES.FILE_INVALID);
      }

      if (stats.size !== dataBuffer.length) {
        this.logger.warn('File size mismatch after write', {
          operation: 'LocalUpload',
          expectedSize: dataBuffer.length,
          actualSize: stats.size,
          key,
          path: fullPath,
        });
      }

      const url = this.buildUrl(key);

      this.logger.info('File uploaded to local storage', {
        operation: 'LocalUpload',
        key,
        path: fullPath,
        size: stats.size,
        expectedSize: dataBuffer.length,
      });

      return {
        provider: 'local',
        key,
        path: fullPath,
        url,
        size: stats.size,
        contentType: options.contentType,
      };
    } catch (error) {
      this.logger.error('Local upload failed', {
        operation: 'LocalUpload',
        key,
        error: error.message,
      });
      throw new StorageError(`Failed to upload to local storage: ${error.message}`);
    }
  }

  async download(key) {
    this.validateKey(key);

    try {
      const fullPath = this.getFullPath(key);
      const buffer = await fs.readFile(fullPath);

      this.logger.debug('File downloaded from local storage', {
        operation: 'LocalDownload',
        key,
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      if (error.code === 'ENOENT') {
        const { ERROR_CODES } = require('@constants');
        throw new StorageError(`File not found: ${key}`, ERROR_CODES.FILE_NOT_FOUND);
      }
      throw new StorageError(`Failed to download from local storage: ${error.message}`);
    }
  }

  async delete(key) {
    this.validateKey(key);

    try {
      const fullPath = this.getFullPath(key);
      await fs.unlink(fullPath);

      this.logger.info('File deleted from local storage', {
        operation: 'LocalDelete',
        key,
      });

      // Cleanup empty directories
      await this.cleanupEmptyDirectories(path.dirname(fullPath));

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // Already deleted
      }
      throw new StorageError(`Failed to delete from local storage: ${error.message}`);
    }
  }

  async exists(key) {
    try {
      const fullPath = this.getFullPath(key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key) {
    this.validateKey(key);

    try {
      const fullPath = this.getFullPath(key);
      const stats = await fs.stat(fullPath);

      return {
        key,
        path: fullPath,
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new StorageError(`File not found: ${key}`, ERROR_CODES.FILE_NOT_FOUND);
      }
      throw new StorageError(`Failed to get metadata: ${error.message}`);
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    // For local storage, just return the regular URL
    // In production, you might implement JWT-based signed URLs
    return this.buildUrl(key);
  }

  async list(prefix = '', options = {}) {
    try {
      const searchPath = this.getFullPath(prefix);

      // Ensure base directory exists
      await this.ensureDirectory(this.basePath);

      const files = await this.recursiveReadDir(searchPath);

      return {
        files: files.map(file => ({
          key: path.relative(this.basePath, file.path),
          path: file.path,
          size: file.size,
          lastModified: file.mtime,
        })),
      };
    } catch (error) {
      // If directory doesn't exist, return empty list instead of error
      if (error.code === 'ENOENT') {
        return { files: [] };
      }
      throw new StorageError(`Failed to list files: ${error.message}`);
    }
  }

  async copy(sourceKey, destKey) {
    this.validateKey(sourceKey);
    this.validateKey(destKey);

    try {
      const sourcePath = this.getFullPath(sourceKey);
      const destPath = this.getFullPath(destKey);

      await this.ensureDirectory(path.dirname(destPath));
      await fs.copyFile(sourcePath, destPath);

      this.logger.info('File copied in local storage', {
        operation: 'LocalCopy',
        sourceKey,
        destKey,
      });

      return { sourceKey, destKey };
    } catch (error) {
      throw new StorageError(`Failed to copy file: ${error.message}`);
    }
  }

  async move(sourceKey, destKey) {
    this.validateKey(sourceKey);
    this.validateKey(destKey);

    try {
      const sourcePath = this.getFullPath(sourceKey);
      const destPath = this.getFullPath(destKey);

      await this.ensureDirectory(path.dirname(destPath));
      await fs.rename(sourcePath, destPath);

      this.logger.info('File moved in local storage', {
        operation: 'LocalMove',
        sourceKey,
        destKey,
      });

      return { sourceKey, destKey };
    } catch (error) {
      throw new StorageError(`Failed to move file: ${error.message}`);
    }
  }

  // Helper methods

  getFullPath(key) {
    return path.join(this.basePath, key);
  }

  buildUrl(key) {
    return `${this.baseUrl}/${key}`;
  }

  validateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Storage key must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    // Prevent directory traversal
    if (key.includes('..')) {
      throw new ValidationError('Invalid key: directory traversal not allowed', ERROR_CODES.VALIDATION_ERROR);
    }
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async cleanupEmptyDirectories(dirPath) {
    try {
      const items = await fs.readdir(dirPath);
      const normalizedDirPath = path.resolve(dirPath);
      const normalizedBasePath = path.resolve(this.basePath);

      if (items.length === 0 && normalizedDirPath !== normalizedBasePath && normalizedDirPath.startsWith(normalizedBasePath)) {
        await fs.rmdir(dirPath);
        await this.cleanupEmptyDirectories(path.dirname(dirPath));
      }
    } catch {
      // Ignore errors during cleanup
    }
  }

  async recursiveReadDir(dirPath) {
    const files = [];

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          const subFiles = await this.recursiveReadDir(fullPath);
          files.push(...subFiles);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({
            path: fullPath,
            size: stats.size,
            mtime: stats.mtime,
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return files;
  }
}

module.exports = LocalStorageProvider;

