/**
 * UTILS MODULE
 * 
 * Clean exports for utility functions and classes organized by category.
 * 
 * @module utils
 */

// Core utilities
const logger = require('./core/logger');
const deepFreeze = require('./core/deep-freeze');
const { retryWithBackoff } = require('./core/retry');

// Validation utilities
const { validateData, compileSchema, formatValidationErrors, ajv, isEmail, isObjectId, isNotEmpty } = require('./validation/validator');
const { COMMON_SCHEMAS, COMPOSITE_SCHEMAS, API_SCHEMAS } = require('./validation/validation-schemas');
const constantsUtils = require('./validation/constants.utils');

// Formatting utilities
const ResponseFormatter = require('./formatting/responseFormatter');
const Hateoas = require('./formatting/hateoas');
const Pagination = require('./formatting/pagination');

// Data processing utilities
const CVDataTransformer = require('./cv-data-transformer');
const StringCleaner = require('./data/StringCleaner');
const extractSection = require('./data/sectionExtractor');

// Messaging utilities
const { sanitizeJobData, sanitizeJobId } = require('./messaging/bullmq-helper');
const CleanupUtils = require('./messaging/cleanup');

// Monitoring utilities
const AIValidationMetrics = require('./monitoring/AIValidationMetrics');

// Security utilities
const { ownsResource, requireOwnership } = require('./security/ownership');

// Export validation utilities as object for convenience
const validationMiddleware = {
  validateData,
  compileSchema,
  formatValidationErrors,
  ajv,
  isEmail,
  isObjectId,
  isNotEmpty,
};

// Export BullMQ helper as object
const bullmqHelper = {
  sanitizeJobData,
  sanitizeJobId,
};

module.exports = {
  // Core
  logger,
  deepFreeze,
  retryWithBackoff,

  // Validation
  validator: validationMiddleware,
  validateData,
  compileSchema,
  formatValidationErrors,
  ajv,
  isEmail,
  isObjectId,
  isNotEmpty,
  validationSchemas: {
    COMMON_SCHEMAS,
    COMPOSITE_SCHEMAS,
    API_SCHEMAS,
  },
  constantsUtils,

  // Formatting
  ResponseFormatter,
  hateoas: Hateoas,
  pagination: Pagination,

  // Data
  CVDataTransformer,
  StringCleaner,
  extractSection,

  // Messaging
  bullmqHelper,
  CleanupUtils,

  // Monitoring
  AIValidationMetrics,

  // Security
  ownsResource,
  requireOwnership,
};
