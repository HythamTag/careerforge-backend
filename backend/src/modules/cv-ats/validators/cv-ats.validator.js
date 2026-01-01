/**
 * CV ATS VALIDATORS
 *
 * Validation schemas for CV ATS analysis operations.
 *
 * @module modules/cv-ats/validators/cv-ats.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, PAGINATION, ATS_STATUS, ATS_PRIORITY, ATS_TYPE, CV_ATS } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const targetJobSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: STRING_LIMITS.NAME_MIN_LENGTH,
      maxLength: STRING_LIMITS.JOB_TITLE_MAX_LENGTH,
    },
    company: {
      type: 'string',
      minLength: STRING_LIMITS.NAME_MIN_LENGTH,
      maxLength: STRING_LIMITS.COMPANY_NAME_MAX_LENGTH,
    },
    description: {
      type: 'string',
      minLength: STRING_LIMITS.SKILL_MIN_LENGTH,
      maxLength: STRING_LIMITS.JOB_DESCRIPTION_MAX_LENGTH,
    },
    requirements: {
      type: 'array',
      items: {
        type: 'string',
        minLength: STRING_LIMITS.SKILL_MIN_LENGTH,
        maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
      },
      maxItems: NUMERIC_LIMITS.MAX_JOB_REQUIREMENTS,
    },
  },
};

const startCvAtsAnalysisSchema = {
  type: 'object',
  required: ['cvId'],
  additionalProperties: false,
  properties: {
    cvId: {
      type: 'string',
      format: 'objectId',
    },
    versionId: {
      type: 'string',
      format: 'objectId',
    },
    type: {
      type: 'string',
      enum: Object.values(ATS_TYPE),
    },
    targetJob: targetJobSchema,
    priority: {
      type: 'string',
      enum: Object.values(ATS_PRIORITY),
    },
    parameters: {
      type: 'object',
    },
    // Support legacy options structure for backward compatibility if needed, 
    // but prefer root level properties.
    options: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: Object.values(ATS_TYPE),
        },
        priority: {
          type: 'string',
          enum: Object.values(ATS_PRIORITY),
        },
        targetJob: targetJobSchema,
      },
    },
  },
};

const getCvAtsAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    jobId: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const cancelCvAtsAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    jobId: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const historyQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.MAX_PAGE,
      default: PAGINATION.DEFAULT_PAGE,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.MAX_LIMIT,
      default: PAGINATION.DEFAULT_LIMIT,
    },
    status: {
      type: 'string',
      enum: [
        ATS_STATUS.PENDING,
        ATS_STATUS.PROCESSING,
        ATS_STATUS.COMPLETED,
        ATS_STATUS.FAILED,
        ATS_STATUS.CANCELLED
      ],
    },
    type: {
      type: 'string',
      enum: Object.values(ATS_TYPE),
    },
    cvId: {
      type: 'string',
      format: 'objectId',
    },
    sort: {
      type: 'string',
      enum: ['createdAt', '-createdAt', 'completedAt', '-completedAt', 'overallScore', '-overallScore'],
      default: '-createdAt',
    },
  },
};

const trendsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    timeframe: {
      type: 'string',
      pattern: '^[0-9]+d$',
      default: CV_ATS.DEFAULT_TIMEFRAME,
    },
  },
};

const recentScoresQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: {
      type: 'integer',
      minimum: NUMERIC_LIMITS.PAGE_MIN,
      maximum: NUMERIC_LIMITS.MAX_JOB_REQUIREMENTS,
      default: PAGINATION.PARSING_HISTORY_LIMIT,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateStartCvAtsAnalysis(data) {
  return require('@utils/validator').validateData(data, startCvAtsAnalysisSchema);
}

function validateGetCvAtsAnalysis(data) {
  return require('@utils/validator').validateData(data, getCvAtsAnalysisSchema);
}

function validateCancelCvAtsAnalysis(data) {
  return require('@utils/validator').validateData(data, cancelCvAtsAnalysisSchema);
}

function validateHistoryQuery(data) {
  return require('@utils/validator').validateData(data, historyQuerySchema);
}

function validateTrendsQuery(data) {
  return require('@utils/validator').validateData(data, trendsQuerySchema);
}

function validateRecentScoresQuery(data) {
  return require('@utils/validator').validateData(data, recentScoresQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateStartCvAtsAnalysisMiddleware = validateRequest(startCvAtsAnalysisSchema);
const validateGetCvAtsAnalysisMiddleware = validateParams(getCvAtsAnalysisSchema);
const validateCancelCvAtsAnalysisMiddleware = validateParams(cancelCvAtsAnalysisSchema);
const validateHistoryQueryMiddleware = validateQuery(historyQuerySchema);
const validateTrendsQueryMiddleware = validateQuery(trendsQuerySchema);
const validateRecentScoresQueryMiddleware = validateQuery(recentScoresQuerySchema);

module.exports = {
  // Schemas
  startCvAtsAnalysisSchema,
  getCvAtsAnalysisSchema,
  cancelCvAtsAnalysisSchema,
  historyQuerySchema,
  trendsQuerySchema,
  recentScoresQuerySchema,

  // Validation functions
  validateStartCvAtsAnalysis,
  validateGetCvAtsAnalysis,
  validateCancelCvAtsAnalysis,
  validateHistoryQuery,
  validateTrendsQuery,
  validateRecentScoresQuery,

  // Middleware
  validateStartCvAtsAnalysisMiddleware,
  validateGetCvAtsAnalysisMiddleware,
  validateCancelCvAtsAnalysisMiddleware,
  validateHistoryQueryMiddleware,
  validateTrendsQueryMiddleware,
  validateRecentScoresQueryMiddleware,
};
