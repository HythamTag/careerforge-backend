/**
 * STORAGE CONFIGURATION
 *
 * File storage configuration (local and S3).
 */

class StorageConfig {
  static getConfig(env) {
    return {
      type: env.STORAGE_TYPE,
      local: {
        uploadPath: env.STORAGE_LOCAL_PATH,
        tempPath: `${env.STORAGE_LOCAL_PATH}/temp`,
        maxFileAge: env.STORAGE_LOCAL_MAX_FILE_AGE,
      },
      s3: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION,
        bucketName: env.S3_BUCKET_NAME,
        publicRead: env.S3_PUBLIC_READ,
        signedUrlExpiry: env.S3_SIGNED_URL_EXPIRY,
      },
    };
  }
}

module.exports = StorageConfig;
