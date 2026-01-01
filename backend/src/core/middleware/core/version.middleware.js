/**
 * API VERSION MIDDLEWARE
 *
 * Handles API versioning for the CV Enhancer application.
 * Supports version detection and routing for different API versions.
 *
 * Current Version: v1 (/v1/)
 *
 * @module middleware/version.middleware
 */

const logger = require('@utils/logger');
const { HTTP_STATUS } = require('@constants');

/**
 * API Version Middleware
 *
 * Detects and validates API version from request URL.
 * Sets version context for downstream handlers.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const versionMiddleware = (req, res, next) => {
  try {
    const originalUrl = req.originalUrl;
    const baseUrl = req.baseUrl || '';

    logger.info(`[VersionMiddleware] originalUrl: ${originalUrl}, baseUrl: ${baseUrl}`);

    // Extract version from URL path
    const versionMatch = originalUrl.match(/^\/(v\d+)/);

    if (versionMatch) {
      const version = versionMatch[1];

      // Validate supported versions
      const supportedVersions = ['v1'];

      if (!supportedVersions.includes(version)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_API_VERSION',
            message: `API version '${version}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
          },
        });
      }

      // Set version in request context
      req.apiVersion = version;
      req.versionPrefix = `/${version}`;

      logger.debug('API version detected', {
        version,
        path: originalUrl,
        method: req.method,
      });

    } else {
      // No version prefix - return error
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'API_VERSION_REQUIRED',
          message: 'API version is required. Use /v1/ prefix for all endpoints.',
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Version middleware error', { error: error.message });
    next(error);
  }
};

/**
 * Require Minimum Version Middleware
 *
 * Ensures request uses minimum required API version
 *
 * @param {string} minVersion - Minimum version required (e.g., 'v1')
 */
const requireMinVersion = (minVersion) => {
  return (req, res, next) => {
    const currentVersion = req.apiVersion;

    if (!currentVersion) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'API_VERSION_REQUIRED',
          message: `This endpoint requires API version ${minVersion} or higher`,
        },
      });
    }

    // Simple version comparison (extend for complex versioning)
    const versionNumber = parseInt(currentVersion.replace('v', ''));
    const minVersionNumber = parseInt(minVersion.replace('v', ''));

    if (versionNumber < minVersionNumber) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_API_VERSION',
          message: `This endpoint requires API version ${minVersion} or higher. Current: ${currentVersion}`,
        },
      });
    }

    next();
  };
};

/**
 * Version Router Helper
 *
 * Creates versioned routes with automatic prefixing
 *
 * @param {string} version - API version (e.g., 'v1')
 * @param {Object} router - Express router instance
 */
const createVersionedRouter = (version, router) => {
  const versionedRouter = require('express').Router();

  // Apply version middleware
  versionedRouter.use(`/${version}`, (req, res, next) => {
    req.apiVersion = version;
    req.versionPrefix = `/${version}`;
    next();
  }, router);

  return versionedRouter;
};

module.exports = {
  versionMiddleware,
  requireMinVersion,
  createVersionedRouter,
};

