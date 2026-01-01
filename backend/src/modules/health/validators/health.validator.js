/**
 * HEALTH VALIDATORS
 *
 * Validation schemas for health monitoring operations.
 * Health endpoints are primarily read-only with minimal validation requirements.
 *
 * @module modules/health/validators/health.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateQuery } = validationMiddleware;
const { NUMERIC_LIMITS } = require('@constants');
const config = require('@config');

// ==========================================
// SCHEMAS
// ==========================================

const performanceQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    includeHistorical: {
      type: 'boolean',
      default: false,
    },
    timeRange: {
      type: 'string',
      enum: ['5m', '15m', '1h', '24h'],
      default: '15m',
    },
    metrics: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['response_time', 'memory', 'cpu', 'requests', 'errors'],
      },
      default: ['response_time', 'memory', 'cpu'],
    },
  },
};

const detailedHealthQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    includeDependencies: {
      type: 'boolean',
      default: true,
    },
    includeMetrics: {
      type: 'boolean',
      default: false,
    },
    timeout: {
      type: 'integer',
      minimum: 1000,
      maximum: 30000,
      default: config.database.connectionTimeout,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validatePerformanceQuery(data) {
  return require('@utils/validator').validateData(data, performanceQuerySchema);
}

function validateDetailedHealthQuery(data) {
  return require('@utils/validator').validateData(data, detailedHealthQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validatePerformanceQueryMiddleware = validateQuery(performanceQuerySchema);
const validateDetailedHealthQueryMiddleware = validateQuery(detailedHealthQuerySchema);

module.exports = {
  // Schemas
  performanceQuerySchema,
  detailedHealthQuerySchema,

  // Validation functions
  validatePerformanceQuery,
  validateDetailedHealthQuery,

  // Middleware
  validatePerformanceQueryMiddleware,
  validateDetailedHealthQueryMiddleware,
};
