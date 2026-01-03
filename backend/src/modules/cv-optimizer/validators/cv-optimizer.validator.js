/**
 * CV OPTIMIZER VALIDATORS
 *
 * Validation schemas for CV optimization operations.
 *
 * @module modules/cv-optimizer/validators/cv-optimizer.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const { STRING_LIMITS, NUMERIC_LIMITS, OPTIMIZER_CONFIG } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const optimizeCvSchema = {
  type: 'object',
  required: ['cvData'],
  additionalProperties: false,
  properties: {
    cvData: {
      type: 'object',
      additionalProperties: true,
      minProperties: 1,
    },
    cvId: {
      type: 'string',
    },
    options: {
      type: 'object',
      additionalProperties: false,
      properties: {
        temperature: {
          type: 'number',
          minimum: NUMERIC_LIMITS.SCORE_MIN,
          maximum: NUMERIC_LIMITS.SCORE_MAX,
          default: OPTIMIZER_CONFIG.DEFAULT_WEIGHT_SKILLS,
        },
        model: {
          type: 'string',
          minLength: STRING_LIMITS.SKILL_MIN_LENGTH,
          maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
        },
        sections: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
          },
          maxItems: 20,
        },
      },
    },
  },
};

const optimizeSectionsSchema = {
  type: 'object',
  required: ['cvData', 'sections'],
  additionalProperties: false,
  properties: {
    cvData: {
      type: 'object',
      additionalProperties: true,
      minProperties: 1,
    },
    cvId: {
      type: 'string',
    },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'string',
        enum: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
      },
    },
    options: {
      type: 'object',
      additionalProperties: false,
      properties: {
        temperature: {
          type: 'number',
          minimum: NUMERIC_LIMITS.SCORE_MIN,
          maximum: NUMERIC_LIMITS.SCORE_MAX,
          default: OPTIMIZER_CONFIG.DEFAULT_WEIGHT_EXPERIENCE,
        },
        model: {
          type: 'string',
          minLength: STRING_LIMITS.SKILL_MIN_LENGTH,
          maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
        },
      },
    },
  },
};

const tailorForJobSchema = {
  type: 'object',
  required: ['cvData', 'jobData'],
  additionalProperties: false,
  properties: {
    cvData: {
      type: 'object',
      additionalProperties: true,
      minProperties: 1,
    },
    cvId: {
      type: 'string',
    },
    jobData: {
      type: 'object',
      required: ['title'],
      additionalProperties: true,
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
    },
    options: {
      type: 'object',
      additionalProperties: false,
      properties: {
        temperature: {
          type: 'number',
          minimum: NUMERIC_LIMITS.SCORE_MIN,
          maximum: NUMERIC_LIMITS.SCORE_MAX,
          default: OPTIMIZER_CONFIG.DEFAULT_WEIGHT_SECTIONS,
        },
        model: {
          type: 'string',
          minLength: STRING_LIMITS.SKILL_MIN_LENGTH,
          maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
        },
      },
    },
  },
};

const capabilitiesQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {},
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateOptimizeCv(data) {
  return require('@utils/validator').validateData(data, optimizeCvSchema);
}

function validateOptimizeSections(data) {
  return require('@utils/validator').validateData(data, optimizeSectionsSchema);
}

function validateTailorForJob(data) {
  return require('@utils/validator').validateData(data, tailorForJobSchema);
}

function validateCapabilitiesQuery(data) {
  return require('@utils/validator').validateData(data, capabilitiesQuerySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateOptimizeCvMiddleware = validateRequest(optimizeCvSchema);
const validateOptimizeSectionsMiddleware = validateRequest(optimizeSectionsSchema);
const validateTailorForJobMiddleware = validateRequest(tailorForJobSchema);
const validateCapabilitiesQueryMiddleware = validateQuery(capabilitiesQuerySchema);

module.exports = {
  // Schemas
  optimizeCvSchema,
  optimizeSectionsSchema,
  tailorForJobSchema,
  capabilitiesQuerySchema,

  // Validation functions
  validateOptimizeCv,
  validateOptimizeSections,
  validateTailorForJob,
  validateCapabilitiesQuery,

  // Middleware
  validateOptimizeCvMiddleware,
  validateOptimizeSectionsMiddleware,
  validateTailorForJobMiddleware,
  validateCapabilitiesQueryMiddleware,
};
