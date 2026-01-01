/**
 * WEBHOOK VALIDATORS
 *
 * Validation schemas for webhook management operations.
 *
 * @module modules/webhooks/validators/webhook.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, WEBHOOK, WEBHOOK_RETRY_CONFIG, WEBHOOK_VALIDATION, CLEANUP, WEBHOOK_DELIVERY_STATUS } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const createWebhookSchema = {
  type: 'object',
  required: ['url', 'events'],
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      format: 'uri',
      maxLength: STRING_LIMITS.URL_MAX_LENGTH,
    },
    events: {
      type: 'array',
      minItems: NUMERIC_LIMITS.MIN_ARRAY_LENGTH,
      maxItems: NUMERIC_LIMITS.DEFAULT_LIMIT,
      items: {
        type: 'string',
        enum: [
          'cv.parsed',
          'cv.enhanced',
          'cv.generated',
          'ats.analyzed',
          'job.completed',
          'job.failed',
          'job.cancelled',
          'user.created',
          'user.updated',
        ],
      },
    },
    secret: {
      type: 'string',
      minLength: 16,
      maxLength: WEBHOOK.SECRET_MAX_LENGTH,
    },
    name: {
      type: 'string',
      minLength: NUMERIC_LIMITS.MIN_STRING_LENGTH,
      maxLength: STRING_LIMITS.TARGET_ROLE_MAX_LENGTH,
    },
    active: {
      type: 'boolean',
      default: true,
    },
    headers: {
      type: 'object',
      additionalProperties: {
        type: 'string',
        maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
      },
      propertyNames: {
        pattern: '^[a-zA-Z][a-zA-Z0-9-_]*$',
        maxLength: STRING_LIMITS.CATEGORY_MAX_LENGTH,
      },
    },
    retryPolicy: {
      type: 'object',
      additionalProperties: false,
      properties: {
        maxRetries: {
          type: 'integer',
          minimum: 0,
          maximum: WEBHOOK.MAX_RETRY_ATTEMPTS,
          default: WEBHOOK_RETRY_CONFIG.MAX_RETRIES,
        },
        backoffMultiplier: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          default: WEBHOOK_RETRY_CONFIG.BACKOFF_MULTIPLIER,
        },
      },
    },
  },
};

const updateWebhookSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      format: 'uri',
      maxLength: STRING_LIMITS.URL_MAX_LENGTH,
    },
    events: {
      type: 'array',
      minItems: NUMERIC_LIMITS.MIN_ARRAY_LENGTH,
      maxItems: NUMERIC_LIMITS.DEFAULT_LIMIT,
      items: {
        type: 'string',
        enum: [
          'cv.parsed',
          'cv.enhanced',
          'cv.generated',
          'ats.analyzed',
          'job.completed',
          'job.failed',
          'job.cancelled',
          'user.created',
          'user.updated',
        ],
      },
    },
    secret: {
      type: 'string',
      minLength: 16,
      maxLength: WEBHOOK.SECRET_MAX_LENGTH,
    },
    name: {
      type: 'string',
      minLength: NUMERIC_LIMITS.MIN_STRING_LENGTH,
      maxLength: STRING_LIMITS.TARGET_ROLE_MAX_LENGTH,
    },
    active: {
      type: 'boolean',
    },
    headers: {
      type: 'object',
      additionalProperties: {
        type: 'string',
        maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
      },
      propertyNames: {
        pattern: '^[a-zA-Z][a-zA-Z0-9-_]*$',
        maxLength: STRING_LIMITS.CATEGORY_MAX_LENGTH,
      },
    },
    retryPolicy: {
      type: 'object',
      additionalProperties: false,
      properties: {
        maxRetries: {
          type: 'integer',
          minimum: 0,
          maximum: WEBHOOK.MAX_RETRY_ATTEMPTS,
        },
        backoffMultiplier: {
          type: 'number',
          minimum: 1,
          maximum: 5,
        },
      },
    },
  },
  // At least one property must be present
  anyOf: [
    { required: ['url'] },
    { required: ['events'] },
    { required: ['secret'] },
    { required: ['name'] },
    { required: ['active'] },
    { required: ['headers'] },
    { required: ['retryPolicy'] },
  ],
};

const webhookIdParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const deliveryIdParamsSchema = {
  type: 'object',
  required: ['id', 'deliveryId'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'objectId',
    },
    deliveryId: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const getWebhooksQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: {
      type: 'integer',
      minimum: NUMERIC_LIMITS.LIMIT_MIN,
      maximum: NUMERIC_LIMITS.LIMIT_MAX,
      default: NUMERIC_LIMITS.DEFAULT_LIMIT,
    },
    offset: {
      type: 'integer',
      minimum: NUMERIC_LIMITS.SCORE_MIN,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
    active: {
      type: 'boolean',
    },
    events: {
      type: 'string', // Comma-separated list
    },
    sortBy: {
      type: 'string',
      enum: ['createdAt', 'updatedAt', 'name', 'active'],
      default: 'createdAt',
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
    },
  },
};

const deliveriesQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: {
      type: 'integer',
      minimum: NUMERIC_LIMITS.LIMIT_MIN,
      maximum: NUMERIC_LIMITS.LIMIT_MAX,
      default: NUMERIC_LIMITS.DEFAULT_LIMIT,
    },
    offset: {
      type: 'integer',
      minimum: NUMERIC_LIMITS.SCORE_MIN,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
    status: {
      type: 'string',
      enum: [
        WEBHOOK_DELIVERY_STATUS.PENDING,
        WEBHOOK_DELIVERY_STATUS.SUCCESS,
        WEBHOOK_DELIVERY_STATUS.FAILED,
        WEBHOOK_DELIVERY_STATUS.RETRYING
      ],
    },
    event: {
      type: 'string',
      enum: [
        'cv.parsed',
        'cv.enhanced',
        'cv.generated',
        'ats.analyzed',
        'job.completed',
        'job.failed',
        'job.cancelled',
        'user.created',
        'user.updated',
      ],
    },
    since: {
      type: 'string',
      format: 'date-time',
    },
    until: {
      type: 'string',
      format: 'date-time',
    },
  },
};

const trendsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    period: {
      type: 'string',
      enum: ['hour', 'day', 'week', 'month'],
      default: 'day',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD,
    },
  },
};

const bulkWebhookOperationSchema = {
  type: 'object',
  required: ['webhookIds'],
  additionalProperties: false,
  properties: {
    webhookIds: {
      type: 'array',
      minItems: NUMERIC_LIMITS.MIN_ARRAY_LENGTH,
      maxItems: WEBHOOK_VALIDATION.MAX_ATTEMPTS_VALUE,
      items: {
        type: 'string',
        format: 'objectId',
      },
    },
  },
};

const cleanupDeliveriesSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    olderThan: {
      type: 'string',
      format: 'date-time',
    },
    status: {
      type: 'string',
      enum: [
        WEBHOOK_DELIVERY_STATUS.SUCCESS,
        WEBHOOK_DELIVERY_STATUS.FAILED
      ],
    },
    maxAge: {
      type: 'integer',
      minimum: 1,
      maximum: 365, // days
      default: CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateCreateWebhook(data) {
  return require('@utils/validator').validateData(data, createWebhookSchema);
}

function validateUpdateWebhook(data) {
  return require('@utils/validator').validateData(data, updateWebhookSchema);
}

function validateWebhookIdParams(data) {
  return require('@utils/validator').validateData(data, webhookIdParamsSchema);
}

function validateDeliveryIdParams(data) {
  return require('@utils/validator').validateData(data, deliveryIdParamsSchema);
}

function validateGetWebhooksQuery(data) {
  return require('@utils/validator').validateData(data, getWebhooksQuerySchema);
}

function validateDeliveriesQuery(data) {
  return require('@utils/validator').validateData(data, deliveriesQuerySchema);
}

function validateTrendsQuery(data) {
  return require('@utils/validator').validateData(data, trendsQuerySchema);
}

function validateBulkWebhookOperation(data) {
  return require('@utils/validator').validateData(data, bulkWebhookOperationSchema);
}

function validateCleanupDeliveries(data) {
  return require('@utils/validator').validateData(data, cleanupDeliveriesSchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateCreateWebhookMiddleware = validateRequest(createWebhookSchema);
const validateUpdateWebhookMiddleware = validateRequest(updateWebhookSchema);
const validateWebhookIdParamsMiddleware = validateParams(webhookIdParamsSchema);
const validateDeliveryIdParamsMiddleware = validateParams(deliveryIdParamsSchema);
const validateGetWebhooksQueryMiddleware = validateQuery(getWebhooksQuerySchema);
const validateDeliveriesQueryMiddleware = validateQuery(deliveriesQuerySchema);
const validateTrendsQueryMiddleware = validateQuery(trendsQuerySchema);
const validateBulkWebhookOperationMiddleware = validateRequest(bulkWebhookOperationSchema);
const validateCleanupDeliveriesMiddleware = validateRequest(cleanupDeliveriesSchema);

module.exports = {
  // Schemas
  createWebhookSchema,
  updateWebhookSchema,
  webhookIdParamsSchema,
  deliveryIdParamsSchema,
  getWebhooksQuerySchema,
  deliveriesQuerySchema,
  trendsQuerySchema,
  bulkWebhookOperationSchema,
  cleanupDeliveriesSchema,

  // Validation functions
  validateCreateWebhook,
  validateUpdateWebhook,
  validateWebhookIdParams,
  validateDeliveryIdParams,
  validateGetWebhooksQuery,
  validateDeliveriesQuery,
  validateTrendsQuery,
  validateBulkWebhookOperation,
  validateCleanupDeliveries,

  // Middleware
  validateCreateWebhookMiddleware,
  validateUpdateWebhookMiddleware,
  validateWebhookIdParamsMiddleware,
  validateDeliveryIdParamsMiddleware,
  validateGetWebhooksQueryMiddleware,
  validateDeliveriesQueryMiddleware,
  validateTrendsQueryMiddleware,
  validateBulkWebhookOperationMiddleware,
  validateCleanupDeliveriesMiddleware,
};
