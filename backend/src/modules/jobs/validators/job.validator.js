/**
 * JOB VALIDATORS
 *
 * Validation schemas for job management operations.
 *
 * @module modules/jobs/validators/job.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, JOB_STATUS } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const jobIdParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      minLength: STRING_LIMITS.JOB_ID_MIN_LENGTH,
      maxLength: STRING_LIMITS.JOB_ID_MAX_LENGTH,
    },
  },
};

const getJobLogsQuerySchema = {
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
    level: {
      type: 'string',
      enum: ['error', 'warn', 'info', 'debug'],
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

const getUserJobsQuerySchema = {
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
        JOB_STATUS.PENDING,
        JOB_STATUS.PROCESSING,
        JOB_STATUS.COMPLETED,
        JOB_STATUS.FAILED,
        JOB_STATUS.CANCELLED,
        JOB_STATUS.TIMEOUT
      ],
    },
    type: {
      type: 'string',
      enum: ['resume_parsing', 'resume_enhancement', 'cv_generation', 'ats_analysis', 'webhook_delivery'],
    },
    sortBy: {
      type: 'string',
      enum: ['createdAt', 'updatedAt', 'status', 'type', 'priority'],
      default: 'createdAt',
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateJobIdParams(data) {
  return require('@utils/validator').validateData(data, jobIdParamsSchema);
}

function validateGetJobLogsQuery(data) {
  return require('@utils/validator').validateData(data, getJobLogsQuerySchema);
}

function validateGetUserJobsQuery(data) {
  return require('@utils/validator').validateData(data, getUserJobsQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateJobIdParamsMiddleware = validateParams(jobIdParamsSchema);
const validateGetJobLogsQueryMiddleware = validateQuery(getJobLogsQuerySchema);
const validateGetUserJobsQueryMiddleware = validateQuery(getUserJobsQuerySchema);

module.exports = {
  // Schemas
  jobIdParamsSchema,
  getJobLogsQuerySchema,
  getUserJobsQuerySchema,

  // Validation functions
  validateJobIdParams,
  validateGetJobLogsQuery,
  validateGetUserJobsQuery,

  // Middleware
  validateJobIdParamsMiddleware,
  validateGetJobLogsQueryMiddleware,
  validateGetUserJobsQueryMiddleware,
};
