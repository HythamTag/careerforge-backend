// ============================================================================
// FILE: modules/cv-generation/validators/generation.validator.js
// ============================================================================

/**
 * CV GENERATION VALIDATORS
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, GENERATION_STATUS, OUTPUT_FORMAT, GENERATION_TYPE } = require('@constants');

const previewGenerationSchema = {
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
    templateId: {
      type: 'string',
      minLength: 2,
      maxLength: STRING_LIMITS.TEMPLATE_MAX_LENGTH,
    },
    parameters: {
      type: 'object',
    },
  },
};

const jobIdParamsSchema = {
  type: 'object',
  required: ['jobId'],
  additionalProperties: false,
  properties: {
    jobId: {
      type: 'string',
      // Accept either MongoDB ObjectId OR custom job ID format (e.g., cvgenerati_1234_abcd_ef12)
      minLength: 10,
      maxLength: 100,
    },
  },
};

const historyQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      // Query params come as strings
      type: 'string',
      pattern: '^[0-9]+$',
    },
    limit: {
      // Query params come as strings
      type: 'string',
      pattern: '^[0-9]+$',
    },
    status: {
      // Accept single status value - coerce will happen in controller
      type: 'string',
    },
    format: {
      type: 'string',
      enum: Object.values(OUTPUT_FORMAT),
    },
    cvId: {
      type: 'string',
      // Accept any valid ID format (ObjectId or custom)
      minLength: 10,
      maxLength: 100,
    },
    sort: {
      type: 'string',
      enum: ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'status', 'format'],
      default: '-createdAt',
    },
  },
};

const startGenerationSchema = {
  type: 'object',
  required: [],
  anyOf: [
    {
      required: ['cvId'],
      properties: {
        cvId: { type: 'string', format: 'objectId' }
      }
    },
    {
      required: ['inputData'],
      properties: {
        inputData: { type: 'object' }
      }
    }
  ],
  properties: {
    cvId: {
      type: 'string',
      format: 'objectId',
    },
    versionId: {
      type: 'string',
      format: 'objectId',
    },
    templateId: {
      type: 'string',
      minLength: 2,
      maxLength: STRING_LIMITS.TEMPLATE_MAX_LENGTH,
    },
    outputFormat: {
      type: 'string',
      enum: Object.values(OUTPUT_FORMAT),
    },
    type: {
      type: 'string',
      enum: Object.values(GENERATION_TYPE),
    },
    parameters: {
      type: 'object',
    },
    inputData: {
      type: 'object',
    },
  },
};

const validateStartGenerationMiddleware = validateRequest(startGenerationSchema);
const validatePreviewGenerationMiddleware = validateRequest(previewGenerationSchema);
const validateHistoryQueryMiddleware = validateQuery(historyQuerySchema);
const validateJobIdParamsMiddleware = validateParams(jobIdParamsSchema);

module.exports = {
  startGenerationSchema,
  previewGenerationSchema,
  historyQuerySchema,
  jobIdParamsSchema,
  validateStartGenerationMiddleware,
  validatePreviewGenerationMiddleware,
  validateHistoryQueryMiddleware,
  validateJobIdParamsMiddleware,
};
