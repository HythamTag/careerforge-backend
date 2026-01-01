/**
 * RESPONSE MIDDLEWARE
 *
 * Standardized response handling middleware with consistent formatting.
 * Applies response formatting to all API responses.
 *
 * @module core/middleware/response.middleware
 */

// ==========================================
// CORE MODULES
// ==========================================
const { ResponseFormatter } = require('@utils');
const { HTTP_STATUS } = require('@constants');

/**
 * Response formatting middleware
 * Ensures all responses follow consistent structure
 */
const responseMiddleware = (req, res, next) => {
  // Override res.json to format responses consistently
  const originalJson = res.json;

  res.json = function (data) {
    // If data is already formatted (has success/error structure), use it directly
    if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
      return originalJson.call(this, data);
    }

    // For other responses, wrap in success format
    const formatted = ResponseFormatter.success(data, {
      statusCode: res.statusCode,
      links: {},
      meta: {},
      includeTimestamp: false,
    });
    return originalJson.call(this, formatted.response);
  };

  // Add convenience methods to response object
  res.success = (data, options) => {
    const formatted = ResponseFormatter.success(data, {
      statusCode: options?.statusCode || HTTP_STATUS.OK,
      links: options?.links,
      meta: options?.meta,
      includeTimestamp: options?.includeTimestamp,
      message: options?.message,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.error = (error, statusCode) => {
    const formatted = ResponseFormatter.error(error, statusCode);
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.paginated = (data, paginationOptions, options) => {
    const formatted = ResponseFormatter.paginated(data, {
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      total: paginationOptions.total,
      baseUrl: paginationOptions.baseUrl,
      queryParams: paginationOptions.queryParams,
    }, {
      links: options?.links,
      meta: options?.meta,
      itemLinks: options?.itemLinks,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.resource = (resource, options) => {
    const formatted = ResponseFormatter.resource(resource, {
      links: options?.links,
      meta: options?.meta,
      actions: options?.actions,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.collection = (items, options) => {
    const formatted = ResponseFormatter.collection(items, {
      links: options?.links,
      meta: options?.meta,
      itemLinks: options?.itemLinks,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.jobStatus = (job, options) => {
    const formatted = ResponseFormatter.jobStatus(job, {
      links: options?.links,
      includeProgress: options?.includeProgress !== undefined ? options.includeProgress : true,
      includeMetadata: options?.includeMetadata !== undefined ? options.includeMetadata : true,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.analytics = (data, options) => {
    const formatted = ResponseFormatter.analytics(data, {
      period: options?.period,
      metrics: options?.metrics,
      comparisons: options?.comparisons,
      links: options?.links,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.health = (status, checks, options) => {
    const formatted = ResponseFormatter.health(status, checks, {
      version: options?.version,
      uptime: options?.uptime,
      timestamp: options?.timestamp,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.validationError = (errors, options) => {
    const formatted = ResponseFormatter.validationError(errors, {
      message: options?.message,
      field: options?.field,
    });
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.notFound = (resource, identifier) => {
    const formatted = ResponseFormatter.notFound(resource, identifier);
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.unauthorized = (message) => {
    const formatted = ResponseFormatter.unauthorized(message);
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.forbidden = (message) => {
    const formatted = ResponseFormatter.forbidden(message);
    res.status(formatted.statusCode).json(formatted.response);
  };

  res.rateLimit = (message, retryAfter) => {
    const formatted = ResponseFormatter.rateLimit(message, retryAfter);
    res.status(formatted.statusCode).json(formatted.response);
  };

  next();
};

module.exports = responseMiddleware;

