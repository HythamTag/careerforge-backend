/**
 * S3 STORAGE PROVIDER
 * 
 * AWS S3 implementation of IStorageProvider
 * 
 * @module shared/external/storage/providers/S3StorageProvider
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const IStorageProvider = require('../interfaces/IStorageProvider');
const { StorageError, ValidationError } = require('@errors');
const { ERROR_CODES } = require('@constants');

class S3StorageProvider extends IStorageProvider {
  constructor(config, logger) {
    super();
    this.validateConfig(config);
    
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      maxAttempts: config.maxRetries || 3,
    });
    
    this.bucket = config.bucket || config.bucketName;
    this.logger = logger;
    this.defaultExpiration = config.defaultExpiration || 3600;
  }

  validateConfig(config) {
    const required = ['region', 'accessKeyId', 'secretAccessKey'];
    const missing = required.filter(field => !config[field]);
    
    if (!config.bucket && !config.bucketName) {
      missing.push('bucket or bucketName');
    }
    
    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required S3 config: ${missing.join(', ')}`,
        ERROR_CODES.CONFIGURATION_ERROR
      );
    }
  }

  async upload(data, key, options = {}) {
    this.validateKey(key);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {},
        ACL: options.public ? 'public-read' : 'private',
        ServerSideEncryption: 'AES256',
      });

      await this.client.send(command);

      const url = this.buildUrl(key, options.public);

      this.logger.info('File uploaded to S3', {
        operation: 'S3Upload',
        key,
        bucket: this.bucket,
        size: data.length,
      });

      return {
        provider: 's3',
        key,
        url,
        bucket: this.bucket,
        size: data.length,
        contentType: options.contentType,
      };
    } catch (error) {
      this.logger.error('S3 upload failed', {
        operation: 'S3Upload',
        key,
        error: error.message,
      });
      throw new StorageError(`Failed to upload to S3: ${error.message}`);
    }
  }

  async download(key) {
    this.validateKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      this.logger.debug('File downloaded from S3', {
        operation: 'S3Download',
        key,
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new StorageError(`File not found: ${key}`, ERROR_CODES.FILE_NOT_FOUND);
      }
      
      this.logger.error('S3 download failed', {
        operation: 'S3Download',
        key,
        error: error.message,
      });
      throw new StorageError(`Failed to download from S3: ${error.message}`);
    }
  }

  async delete(key) {
    this.validateKey(key);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);

      this.logger.info('File deleted from S3', {
        operation: 'S3Delete',
        key,
      });

      return true;
    } catch (error) {
      this.logger.error('S3 delete failed', {
        operation: 'S3Delete',
        key,
        error: error.message,
      });
      throw new StorageError(`Failed to delete from S3: ${error.message}`);
    }
  }

  async exists(key) {
    this.validateKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new StorageError(`Failed to check file existence: ${error.message}`);
    }
  }

  async getMetadata(key) {
    this.validateKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata || {},
      };
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new StorageError(`File not found: ${key}`, ERROR_CODES.FILE_NOT_FOUND);
      }
      throw new StorageError(`Failed to get metadata: ${error.message}`);
    }
  }

  async getSignedUrl(key, expiresIn = this.defaultExpiration) {
    this.validateKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      this.logger.debug('Generated signed URL', {
        operation: 'S3SignedUrl',
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      throw new StorageError(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: options.limit || 1000,
        ContinuationToken: options.continuationToken,
      });

      const response = await this.client.send(command);

      return {
        files: (response.Contents || []).map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          etag: item.ETag,
        })),
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated,
      };
    } catch (error) {
      throw new StorageError(`Failed to list files: ${error.message}`);
    }
  }

  async copy(sourceKey, destKey) {
    this.validateKey(sourceKey);
    this.validateKey(destKey);

    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      });

      await this.client.send(command);

      this.logger.info('File copied in S3', {
        operation: 'S3Copy',
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
      await this.copy(sourceKey, destKey);
      await this.delete(sourceKey);
      
      this.logger.info('File moved in S3', {
        operation: 'S3Move',
        sourceKey,
        destKey,
      });

      return { sourceKey, destKey };
    } catch (error) {
      // If copy succeeded but delete failed, log warning but don't fail
      // The file exists in both locations
      this.logger.warn('File copied but original deletion failed during move', {
        operation: 'S3Move',
        sourceKey,
        destKey,
        error: error.message,
      });
      throw new StorageError(`Failed to move file: ${error.message}`);
    }
  }

  validateKey(key) {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Storage key must be a non-empty string', ERROR_CODES.VALIDATION_ERROR);
    }

    const maxKeyLength = 1024; // S3 key length limit
    if (key.length > maxKeyLength) {
      throw new ValidationError(
        `Key length exceeds maximum of ${maxKeyLength}`,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  buildUrl(key, isPublic) {
    if (isPublic) {
      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }
    return null; // Use signed URLs for private files
  }
}

module.exports = S3StorageProvider;

