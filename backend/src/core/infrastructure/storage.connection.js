const { S3Client } = require('@aws-sdk/client-s3');
const logger = require('@utils/logger');
const config = require('@config');
const { STORAGE_TYPES } = require('@constants');

let s3Client = null;

function initializeS3() {
  if ([STORAGE_TYPES.S3, STORAGE_TYPES.BOTH].includes(config.storage.type)) {
    try {
      s3Client = new S3Client({
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        },
        region: config.storage.s3.region,
      });
      logger.info('S3 client initialized', {
        operation: 'S3 initialization',
      });
    } catch (error) {
      logger.logError(error, {
        operation: 'S3 initialization',
      });
      throw error;
    }
  }
}

function getS3Client() {
  if (!s3Client && [STORAGE_TYPES.S3, STORAGE_TYPES.BOTH].includes(config.storage.type)) {
    initializeS3();
  }
  return s3Client;
}

function getStorageType() {
  return config.storage.type;
}

function getS3BucketName() {
  return config.storage.s3.bucketName;
}

module.exports = {
  initializeS3,
  getS3Client,
  getStorageType,
  getS3BucketName,
};


