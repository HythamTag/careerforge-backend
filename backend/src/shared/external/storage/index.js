/**
 * STORAGE SERVICES MODULE
 * 
 * Production-ready storage services with provider pattern
 * 
 * @module shared/external/storage
 */

const StorageService = require('./StorageService');
const StorageProviderFactory = require('./StorageProviderFactory');
const StorageValidator = require('./StorageValidator');
const IStorageProvider = require('./interfaces/IStorageProvider');
const LocalStorageProvider = require('./providers/LocalStorageProvider');

// Alias: FileService is the primary interface used throughout the codebase
const FileService = StorageService;

// Lazy-load S3StorageProvider getter to avoid AWS SDK dependency issues when S3 isn't used
const getS3StorageProvider = () => require('./providers/S3StorageProvider');

module.exports = {
  StorageService,
  FileService,
  StorageProviderFactory,
  StorageValidator,
  IStorageProvider,
  get S3StorageProvider() { return getS3StorageProvider(); },
  LocalStorageProvider,
};
