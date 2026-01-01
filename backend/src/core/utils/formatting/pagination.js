/**
 * Pagination Utility
 *
 * Standardized pagination logic for consistent API responses.
 */
const { NUMERIC_LIMITS, PAGINATION } = require('@constants');

class Pagination {
  /**
   * Calculate pagination metadata
   */
  static calculate(page, limit, total) {
    const currentPage = Math.max(NUMERIC_LIMITS.PAGE_MIN, page ? parseInt(page, 10) : PAGINATION.DEFAULT_PAGE);
    const itemsPerPage = Math.min(Math.max(NUMERIC_LIMITS.LIMIT_MIN, limit ? parseInt(limit, 10) : PAGINATION.DEFAULT_LIMIT), NUMERIC_LIMITS.LIMIT_MAX);
    const totalItems = Math.max(0, total ? parseInt(total, 10) : 0);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ensure current page doesn't exceed total pages
    const actualPage = Math.min(currentPage, Math.max(NUMERIC_LIMITS.PAGE_MIN, totalPages));

    return {
      page: actualPage,
      limit: itemsPerPage,
      total: totalItems,
      totalPages,
      hasNext: actualPage < totalPages,
      hasPrev: actualPage > 1,
      offset: (actualPage - 1) * itemsPerPage,
    };
  }

  /**
   * Generate pagination links for HATEOAS
   */
  static generateLinks(baseUrl, pagination, queryParams = {}) {
    const links = {};

    if (!baseUrl) {return links;}

    const buildUrl = (pageNum) => {
      const params = new URLSearchParams({
        ...queryParams,
        page: pageNum,
        limit: pagination.limit,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    // Self link
    links.self = buildUrl(pagination.page);

    // Navigation links
    if (pagination.hasPrev) {
      links.prev = buildUrl(pagination.page - 1);
    }

    if (pagination.hasNext) {
      links.next = buildUrl(pagination.page + 1);
    }

    // Boundary links
    if (pagination.totalPages >= 1) {
      links.first = buildUrl(1);
      links.last = buildUrl(pagination.totalPages);
    }

    return links;
  }

  /**
   * Validate pagination parameters
   */
  static validate(page, limit) {
    const errors = [];

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }

    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < NUMERIC_LIMITS.LIMIT_MIN || limitNum > NUMERIC_LIMITS.LIMIT_MAX) {
      errors.push(`Limit must be between ${NUMERIC_LIMITS.LIMIT_MIN} and ${NUMERIC_LIMITS.LIMIT_MAX}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize pagination parameters with defaults
   */
  static sanitize(page, limit, defaults = {}) {
    const {
      defaultPage = PAGINATION.DEFAULT_PAGE,
      defaultLimit = PAGINATION.DEFAULT_LIMIT,
      maxLimit = NUMERIC_LIMITS.LIMIT_MAX,
    } = defaults;

    let sanitizedPage = page ? parseInt(page, 10) : defaultPage;
    let sanitizedLimit = limit ? parseInt(limit, 10) : defaultLimit;

    // Ensure valid ranges
    sanitizedPage = Math.max(NUMERIC_LIMITS.PAGE_MIN, sanitizedPage);
    sanitizedLimit = Math.max(NUMERIC_LIMITS.LIMIT_MIN, Math.min(sanitizedLimit, maxLimit));

    return {
      page: sanitizedPage,
      limit: sanitizedLimit,
    };
  }

  /**
   * Create cursor-based pagination (for future use)
   */
  static cursor(options = {}) {
    const {
      cursor,
      limit = PAGINATION.DEFAULT_LIMIT,
      direction = 'next', // 'next' or 'prev'
    } = options;

    return {
      cursor,
      limit: Math.min(Math.max(NUMERIC_LIMITS.LIMIT_MIN, parseInt(limit, 10)), NUMERIC_LIMITS.LIMIT_MAX),
      direction,
    };
  }

  /**
   * Create pagination metadata for responses
   */
  static metadata(pagination, additional = {}) {
    return {
      pagination,
      ...additional,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = Pagination;

