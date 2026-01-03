const { HTTP_STATUS, SERVICE_VERSION, JOB_STATUS, HEALTH_STATUS } = require('@constants');
const config = require('@config');

/**
 * Enhanced Response Formatter with HATEOAS links and comprehensive pagination
 */
class ResponseFormatter {
  /**
   * Create success response with optional HATEOAS links
   */
  static success(data, options) {
    const {
      message,
      statusCode,
      links,
      meta,
      includeTimestamp,
    } = options ? options : {};

    const response = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    if (links && Object.keys(links).length > 0) {
      response._links = links;
    }

    if ((meta && Object.keys(meta).length > 0) || includeTimestamp) {
      response._meta = {
        ...(meta ? meta : {}),
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
      };
    }

    return { response, statusCode: statusCode ? statusCode : HTTP_STATUS.OK };
  }

  /**
   * Create error response with consistent structure
   */
  static error(error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    const { ValidationError } = require('@errors');
    const { ERROR_CODES } = require('@constants');
    if (!error.code) {
      throw new ValidationError('Error must have a code property', ERROR_CODES.VALIDATION_ERROR);
    }
    if (!error.message) {
      throw new ValidationError('Error must have a message property', ERROR_CODES.VALIDATION_ERROR);
    }

    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    // Add additional error details if available
    if (error.details) {
      response.error.details = error.details;
    }

    if (error.field) {
      response.error.field = error.field;
    }

    // Include stack trace in development
    if (config.server.isDevelopment && error.stack) {
      response.error.stack = error.stack;
    }

    // Add timestamp for debugging
    if (config.server.isDevelopment) {
      response._meta = {
        timestamp: new Date().toISOString(),
        version: SERVICE_VERSION,
      };
    }

    return {
      response,
      statusCode: error.statusCode ? error.statusCode : statusCode,
    };
  }

  /**
   * Create paginated response with HATEOAS links
   */
  static paginated(data, paginationOptions, options) {
    const {
      page,
      limit,
      total,
      baseUrl,
      queryParams,
    } = paginationOptions ? paginationOptions : {};

    const {
      links,
      meta,
      itemLinks,
    } = options ? options : {};

    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const totalItems = parseInt(total, 10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const pagination = {
      page: currentPage,
      limit: itemsPerPage,
      total: totalItems,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };

    // Generate pagination links
    const paginationLinks = {};

    if (baseUrl) {
      const buildUrl = (pageNum) => {
        const params = new URLSearchParams({
          ...(queryParams ? queryParams : {}),
          page: pageNum,
          limit: itemsPerPage,
        });
        return `${baseUrl}?${params.toString()}`;
      };

      if (pagination.hasPrev) {
        paginationLinks.prev = buildUrl(currentPage - 1);
      }

      if (pagination.hasNext) {
        paginationLinks.next = buildUrl(currentPage + 1);
      }

      paginationLinks.first = buildUrl(1);
      paginationLinks.last = buildUrl(totalPages);
      paginationLinks.self = buildUrl(currentPage);
    }

    // Add item-level links if provided
    let processedData = data;
    if (itemLinks && Array.isArray(data)) {
      processedData = data.map((item, index) => {
        // Convert Mongoose document to plain object with virtuals
        const plainItem = item.toJSON ? item.toJSON() : item;
        return {
          ...plainItem,
          _links: itemLinks(plainItem, index),
        };
      });
    } else if (Array.isArray(data)) {
      // Even without item links, ensure Mongoose documents are properly serialized
      processedData = data.map(item => item.toJSON ? item.toJSON() : item);
    }

    const response = {
      success: true,
      data: processedData,
      pagination,
    };

    // Add pagination links
    if (Object.keys(paginationLinks).length > 0) {
      response._links = {
        ...(links ? links : {}),
        ...paginationLinks,
      };
    } else if (links && Object.keys(links).length > 0) {
      response._links = links;
    }

    // Add metadata
    if (meta && Object.keys(meta).length > 0) {
      response._meta = {
        ...meta,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      response,
      statusCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Create collection response with HATEOAS links
   */
  static collection(items, options) {
    const {
      links,
      meta,
      itemLinks,
    } = options ? options : {};

    let processedItems = items;
    if (itemLinks && Array.isArray(items)) {
      processedItems = items.map((item, index) => {
        const plainItem = item.toJSON ? item.toJSON() : item;
        return {
          ...plainItem,
          _links: itemLinks(plainItem, index),
        };
      });
    } else if (Array.isArray(items)) {
      processedItems = items.map(item => item.toJSON ? item.toJSON() : item);
    }

    return this.success(processedItems, {
      links: links ? links : {},
      meta: {
        ...(meta ? meta : {}),
        count: Array.isArray(items) ? items.length : 1,
        timestamp: new Date().toISOString(),
      },
      includeTimestamp: false,
    });
  }

  /**
   * Create resource response with HATEOAS links
   */
  static resource(resource, options) {
    const {
      links,
      meta,
      actions,
      statusCode,
    } = options ? options : {};

    const response = {
      success: true,
      data: resource,
    };

    // Add HATEOAS links
    if ((links && Object.keys(links).length > 0) || (actions && actions.length > 0)) {
      response._links = { ...(links ? links : {}) };

      // Add action links
      if (actions) {
        actions.forEach(action => {
          if (action.href) {
            response._links[action.rel ? action.rel : action.name] = {
              href: action.href,
              method: action.method,
              ...(action.title && { title: action.title }),
            };
          }
        });
      }
    }

    // Add metadata
    if (meta && Object.keys(meta).length > 0) {
      response._meta = {
        ...meta,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      response,
      statusCode: statusCode ? statusCode : HTTP_STATUS.OK,
    };
  }

  /**
   * Create job status response
   */
  static jobStatus(job, options) {
    const {
      links,
      includeProgress,
      includeMetadata,
    } = options ? options : {};

    const response = {
      success: true,
      data: {
        jobId: job.jobId ? job.jobId : job._id,
        status: job.status,
        type: job.type,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    };

    // Add progress information
    if (includeProgress !== false && job.progress !== undefined) {
      response.data.progress = job.progress;
      if (job.currentStep) {
        response.data.currentStep = job.currentStep;
      }
      if (job.totalSteps) {
        response.data.totalSteps = job.totalSteps;
      }
    }

    // Add timing information
    if (job.startedAt) {
      response.data.startedAt = job.startedAt;
    }
    if (job.completedAt) {
      response.data.completedAt = job.completedAt;
      response.data.processingTimeMs = job.processingTimeMs;
    }
    if (job.queuedAt) {
      response.data.queuedAt = job.queuedAt;
    }

    // Add result information for completed jobs
    if (job.status === JOB_STATUS.COMPLETED && job.result) {
      response.data.result = job.result;
    }

    // Add error information for failed jobs
    if (job.status === JOB_STATUS.FAILED && job.error) {
      response.data.error = job.error;
    }

    // Add metadata
    if (includeMetadata !== false && job.metadata) {
      response.data.metadata = job.metadata;
    }

    // Add HATEOAS links
    const jobLinks = { ...(links ? links : {}) };
    if (!jobLinks.self) {
      jobLinks.self = `/v1/jobs/${job.jobId ? job.jobId : job._id}`;
    }

    if (job.status === JOB_STATUS.COMPLETED && !jobLinks.result) {
      jobLinks.result = `/v1/jobs/${job.jobId ? job.jobId : job._id}/result`;
    }

    if ([JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(job.status) && !jobLinks.cancel) {
      jobLinks.cancel = {
        href: `/v1/jobs/${job.jobId ? job.jobId : job._id}/cancel`,
        method: 'POST',
      };
    }

    if (Object.keys(jobLinks).length > 0) {
      response._links = jobLinks;
    }

    return {
      response,
      statusCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Create webhook event payload
   */
  static webhookEvent(eventType, eventData, options) {
    const {
      eventId,
      timestamp,
      source,
    } = options ? options : {};

    return {
      event: eventType,
      id: eventId,
      timestamp: timestamp ? timestamp : new Date().toISOString(),
      source: source ? source : 'cv-enhancer',
      data: eventData,
    };
  }

  /**
   * Create analytics response
   */
  static analytics(data, options) {
    const {
      period,
      metrics,
      comparisons,
      links,
    } = options ? options : {};

    const response = {
      success: true,
      data,
      analytics: {
        period,
        metrics: metrics ? metrics : [],
        comparisons: comparisons ? comparisons : {},
      },
    };

    if (links && Object.keys(links).length > 0) {
      response._links = links;
    }

    response._meta = {
      generatedAt: new Date().toISOString(),
      period,
    };

    return {
      response,
      statusCode: HTTP_STATUS.OK,
    };
  }

  /**
   * Create health check response
   */
  static health(status, checks, options) {
    const {
      version,
      uptime,
      timestamp,
    } = options ? options : {};

    const response = {
      status,
      checks: checks ? checks : {},
      version: version ? version : SERVICE_VERSION,
      uptime: uptime !== undefined ? uptime : process.uptime(),
      timestamp: timestamp ? timestamp : new Date().toISOString(),
    };

    return {
      response,
      statusCode: status === HEALTH_STATUS.HEALTHY ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE,
    };
  }

  /**
   * Create validation error response
   */
  static validationError(errors, options) {
    const {
      message,
      field,
    } = options ? options : {};

    return this.error({
      code: 'VALIDATION_ERROR',
      message: message ? message : 'Validation failed',
      details: errors,
      field: field ? field : null,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  /**
   * Create not found error response
   */
  static notFound(resource, identifier) {
    const resourceName = resource ? resource : 'Resource';
    const message = identifier ? `${resourceName} with identifier '${identifier}' not found` : `${resourceName} not found`;

    return this.error({
      code: 'NOT_FOUND',
      message,
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  /**
   * Create unauthorized error response
   */
  static unauthorized(message) {
    return this.error({
      code: 'UNAUTHORIZED',
      message: message ? message : 'Authentication required',
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  /**
   * Create forbidden error response
   */
  static forbidden(message) {
    return this.error({
      code: 'FORBIDDEN',
      message: message ? message : 'Access denied',
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  }

  /**
   * Create rate limit error response
   */
  static rateLimit(message, retryAfter) {
    const error = {
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    };

    if (retryAfter) {
      error.details = { retryAfter };
    }

    return this.error(error);
  }
}

module.exports = ResponseFormatter;
module.exports.ResponseFormatter = ResponseFormatter;

