/**
 * MIDDLEWARE MODULE
 * 
 * Centralized middleware exports organized by category.
 * 
 * @module middleware
 */

// Core Middleware
const errorMiddleware = require('./core/error.middleware');
const responseMiddleware = require('./core/response.middleware');
const { validateRequest, validateRequestMultiple, validateParams, validateQuery } = require('./core/validation.middleware');
const correlationMiddleware = require('./core/correlation.middleware');
const requestLoggerMiddleware = require('./core/request-logger.middleware');
const { versionMiddleware, requireMinVersion, createVersionedRouter } = require('./core/version.middleware');
const { setupSwagger, swaggerSpec } = require('./core/docs.middleware');
const { parseCvIdFilter, parseUserIdFilter, parseTypeFilter, parseExpandParameter } = require('./core/query.middleware');


// Security Middleware
const authMiddleware = require('./security/auth.middleware');
const securityMiddleware = require('./security/security.middleware');
const rateLimiterMiddleware = require('./security/rate-limiter.middleware');
const sanitizeMiddleware = require('./security/sanitize.middleware');

// Domain Middleware
const uploadMiddleware = require('./domain/upload.middleware');
const avatarUploadMiddleware = require('./domain/avatar-upload.middleware');

// Export validation middleware functions as object for convenience
const validationMiddleware = {
  validateRequest,
  validateRequestMultiple,
  validateParams,
  validateQuery,
};

module.exports = {
  // Core
  errorMiddleware,
  responseMiddleware,
  validationMiddleware,
  correlationMiddleware,
  requestLoggerMiddleware,
  versionMiddleware,
  requireMinVersion,
  createVersionedRouter,
  setupSwagger,
  swaggerSpec,
  parseCvIdFilter,
  parseUserIdFilter,
  parseTypeFilter,
  parseExpandParameter,

  // Security
  authMiddleware,
  securityMiddleware,
  rateLimiterMiddleware,
  sanitizeMiddleware,

  // Domain
  uploadMiddleware,
  avatarUploadMiddleware,
};

