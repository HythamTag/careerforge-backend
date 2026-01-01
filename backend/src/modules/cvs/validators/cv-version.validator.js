/**
 * CV VERSION VALIDATORS
 *
 * Validation schemas for CV version operations.
 * Uses Ajv JSON schemas for consistent validation.
 *
 * @module modules/cvs/validators/cv-version.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, CV_VERSION_CHANGE_TYPE } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const createVersionBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    content: {
      type: 'object',
      additionalProperties: true,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    changeType: {
      type: 'string',
      enum: Object.values(CV_VERSION_CHANGE_TYPE),
    },
  },
};

const versionIdParamsSchema = {
  type: 'object',
  required: ['id', 'versionId'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'objectId',
    },
    versionId: {
      type: 'string',
      format: 'objectId',
    },
  },
};

const activateVersionBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
  },
};

const getCVVersionsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.PAGE_MAX,
      default: 1,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: NUMERIC_LIMITS.LIMIT_MAX,
      default: 10,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateCreateVersionBody(data) {
  return require('@utils/validator').validateData(data, createVersionBodySchema);
}

function validateVersionIdParams(data) {
  return require('@utils/validator').validateData(data, versionIdParamsSchema);
}

function validateActivateVersionBody(data) {
  return require('@utils/validator').validateData(data, activateVersionBodySchema);
}

function validateGetCVVersionsQuery(data) {
  return require('@utils/validator').validateData(data, getCVVersionsQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateCreateVersionBodyMiddleware = validateRequest(createVersionBodySchema);
const validateVersionIdParamsMiddleware = validateParams(versionIdParamsSchema);
const validateActivateVersionBodyMiddleware = validateRequest(activateVersionBodySchema);
const validateGetCVVersionsQueryMiddleware = validateQuery(getCVVersionsQuerySchema);

module.exports = {
  // Schemas
  createVersionBodySchema,
  versionIdParamsSchema,
  activateVersionBodySchema,
  getCVVersionsQuerySchema,

  // Validation functions
  validateCreateVersionBody,
  validateVersionIdParams,
  validateActivateVersionBody,
  validateGetCVVersionsQuery,

  // Middleware
  validateCreateVersionBodyMiddleware,
  validateVersionIdParamsMiddleware,
  validateActivateVersionBodyMiddleware,
  validateGetCVVersionsQueryMiddleware,
};

