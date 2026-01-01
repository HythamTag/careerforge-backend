/**
 * CV VALIDATORS
 *
 * Validation schemas for CV operations.
 * Uses Ajv JSON schemas for consistent validation.
 *
 * @module modules/cvs/validators/cv.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams, validateQuery } = validationMiddleware;
const {
  STRING_LIMITS,
  NUMERIC_LIMITS,
  CV_ENTITY_STATUS,
  VALIDATION_PATTERNS,
  TEMPLATES,
  CV_SOURCE,
  CV_SETTINGS_OPTIONS,
  CV_PROFICIENCY_LEVELS,
  CV_SORT_OPTIONS,
  CV_BULK_OPERATIONS,
} = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

// CV Content Schema - allows flexible structure while maintaining key validations
const cvContentSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    personal: {
      type: 'object',
      additionalProperties: true,
      properties: {
        name: {
          type: 'string',
          minLength: STRING_LIMITS.NAME_MIN_LENGTH,
          maxLength: STRING_LIMITS.NAME_MAX_LENGTH,
        },
        email: {
          type: 'string',
          format: 'email',
          maxLength: STRING_LIMITS.EMAIL_MAX_LENGTH,
        },
        phone: {
          type: 'string',
          pattern: VALIDATION_PATTERNS.PHONE.source,
          maxLength: STRING_LIMITS.PHONE_MAX_LENGTH,
        },
        location: {
          type: 'string',
          maxLength: STRING_LIMITS.LOCATION_MAX_LENGTH,
        },
        linkedin: {
          type: 'string',
          format: 'uri',
          maxLength: STRING_LIMITS.URL_MAX_LENGTH,
        },
        website: {
          type: 'string',
          format: 'uri',
          maxLength: STRING_LIMITS.URL_MAX_LENGTH,
        },
        summary: {
          type: 'string',
          maxLength: STRING_LIMITS.SUMMARY_MAX_LENGTH,
        },
      },
    },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['company', 'position', 'startDate'],
        properties: {
          company: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.COMPANY_MAX_LENGTH,
          },
          position: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.POSITION_MAX_LENGTH,
          },
          startDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          endDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          description: {
            type: 'string',
            maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
          },
          technologies: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
            },
          },
          achievements: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
            },
          },
          location: {
            type: 'string',
            maxLength: STRING_LIMITS.LOCATION_MAX_LENGTH,
          },
          isCurrent: {
            type: 'boolean',
          },
        },
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['institution', 'degree', 'startDate'],
        properties: {
          institution: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.INSTITUTION_MAX_LENGTH,
          },
          degree: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.DEGREE_MAX_LENGTH,
          },
          field: {
            type: 'string',
            maxLength: STRING_LIMITS.FIELD_MAX_LENGTH,
          },
          startDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          endDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          gpa: {
            type: 'string',
            maxLength: STRING_LIMITS.GPA_MAX_LENGTH,
          },
          honors: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.HONOR_MAX_LENGTH,
            },
          },
          location: {
            type: 'string',
            maxLength: STRING_LIMITS.LOCATION_MAX_LENGTH,
          },
        },
      },
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['category', 'skills'],
        properties: {
          category: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.CATEGORY_MAX_LENGTH,
          },
          skills: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
            },
          },
          proficiency: {
            type: 'string',
            enum: CV_PROFICIENCY_LEVELS.SKILLS,
          },
        },
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.PROJECT_NAME_MAX_LENGTH,
          },
          description: {
            type: 'string',
            maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
          },
          technologies: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.SKILL_MAX_LENGTH,
            },
          },
          startDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          endDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          url: {
            type: 'string',
            format: 'uri',
            maxLength: STRING_LIMITS.URL_MAX_LENGTH,
          },
          urlLabel: {
            type: 'string',
            maxLength: STRING_LIMITS.LABEL_MAX_LENGTH,
          },
          repository: {
            type: 'string',
            format: 'uri',
            maxLength: STRING_LIMITS.URL_MAX_LENGTH,
          },
        },
      },
    },
    certifications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name', 'issuer', 'date'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.CERTIFICATION_MAX_LENGTH,
          },
          issuer: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.ISSUER_MAX_LENGTH,
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          url: {
            type: 'string',
            format: 'uri',
            maxLength: STRING_LIMITS.URL_MAX_LENGTH,
          },
          urlLabel: {
            type: 'string',
            maxLength: STRING_LIMITS.LABEL_MAX_LENGTH,
          },
          credentialId: {
            type: 'string',
            maxLength: STRING_LIMITS.CREDENTIAL_MAX_LENGTH,
          },
        },
      },
    },
    languages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name', 'proficiency'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.LANGUAGE_MAX_LENGTH,
          },
          proficiency: {
            type: 'string',
            enum: CV_PROFICIENCY_LEVELS.LANGUAGES,
          },
        },
      },
    },
    publications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['title', 'authors', 'date'],
        properties: {
          title: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
          },
          authors: {
            type: 'array',
            items: {
              type: 'string',
              maxLength: STRING_LIMITS.AUTHOR_MAX_LENGTH,
            },
          },
          journal: {
            type: 'string',
            maxLength: STRING_LIMITS.JOURNAL_MAX_LENGTH,
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          doi: {
            type: 'string',
            maxLength: STRING_LIMITS.DOI_MAX_LENGTH,
          },
          url: {
            type: 'string',
            format: 'uri',
            maxLength: STRING_LIMITS.URL_MAX_LENGTH,
          },
          urlLabel: {
            type: 'string',
            maxLength: STRING_LIMITS.LABEL_MAX_LENGTH,
          },
        },
      },
    },
    awards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['name', 'date'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.AWARD_MAX_LENGTH,
          },
          issuer: {
            type: 'string',
            maxLength: STRING_LIMITS.ISSUER_MAX_LENGTH,
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          description: {
            type: 'string',
            maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
          },
        },
      },
    },
    volunteer: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['organization', 'role', 'startDate'],
        properties: {
          organization: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.ORGANIZATION_MAX_LENGTH,
          },
          role: {
            type: 'string',
            minLength: 1,
            maxLength: STRING_LIMITS.ROLE_MAX_LENGTH,
          },
          startDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          endDate: {
            type: 'string',
            pattern: '^\\d{4}(-\\d{2})?(-\\d{2})?$',
          },
          description: {
            type: 'string',
            maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
          },
          isCurrent: {
            type: 'boolean',
          },
        },
      },
    },
  },
};

const createCVBodySchema = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: STRING_LIMITS.TAG_MAX_LENGTH,
      },
    },
    content: cvContentSchema,
    template: {
      type: 'string',
      enum: Object.keys(TEMPLATES),
    },
    settings: {
      type: 'object',
      additionalProperties: false,
      properties: {
        theme: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.THEMES,
        },
        language: {
          type: 'string',
          minLength: 2,
          maxLength: 2,
        },
        fontSize: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.FONT_SIZES,
        },
        pageFormat: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.PAGE_FORMATS,
        },
        margins: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.MARGINS,
        },
      },
    },
  },
};

const updateCVBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
    description: {
      type: 'string',
      maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        maxLength: STRING_LIMITS.TAG_MAX_LENGTH,
      },
    },
    content: cvContentSchema,
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED
      ],
    },
    template: {
      type: 'string',
      enum: Object.keys(TEMPLATES),
    },
    settings: {
      type: 'object',
      additionalProperties: false,
      properties: {
        theme: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.THEMES,
        },
        language: {
          type: 'string',
          minLength: 2,
          maxLength: 2,
        },
        fontSize: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.FONT_SIZES,
        },
        pageFormat: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.PAGE_FORMATS,
        },
        margins: {
          type: 'string',
          enum: CV_SETTINGS_OPTIONS.MARGINS,
        },
      },
    },
  },
  minProperties: 1,
};

const cvIdParamsSchema = {
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

const getUserCVsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: {
      type: 'string',
      pattern: '^[1-9][0-9]*$',
    },
    limit: {
      type: 'string',
      pattern: '^[1-9][0-9]*$',
    },
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED,
        'all'
      ],
    },
    search: {
      type: 'string',
      maxLength: STRING_LIMITS.SEARCH_MAX_LENGTH,
    },
    sort: {
      type: 'string',
      pattern: '^-?(createdAt|updatedAt|title|status)$',
    },
    sortBy: {
      type: 'string',
      enum: CV_SORT_OPTIONS.FIELDS,
    },
    sortOrder: {
      type: 'string',
      enum: CV_SORT_OPTIONS.ORDERS,
    },
  },
};

const searchCVsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    q: {
      type: 'string',
      maxLength: STRING_LIMITS.SEARCH_MAX_LENGTH,
    },
    tags: {
      type: 'string',
      maxLength: STRING_LIMITS.TAGS_QUERY_MAX_LENGTH,
    },
    status: {
      type: 'string',
      enum: [
        CV_ENTITY_STATUS.DRAFT,
        CV_ENTITY_STATUS.PUBLISHED,
        CV_ENTITY_STATUS.ARCHIVED,
        'all'
      ],
    },
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

const duplicateCVBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: STRING_LIMITS.TITLE_MAX_LENGTH,
    },
  },
};

const bulkOperationBodySchema = {
  type: 'object',
  required: ['operation', 'cvIds'],
  additionalProperties: false,
  properties: {
    operation: {
      type: 'string',
      enum: CV_BULK_OPERATIONS.OPERATIONS,
    },
    cvIds: {
      type: 'array',
      minItems: NUMERIC_LIMITS.MIN_ARRAY_LENGTH,
      maxItems: NUMERIC_LIMITS.BULK_MAX,
      items: {
        type: 'string',
        format: 'objectId',
      },
    },
    archive: {
      type: 'boolean',
    },
  },
  allOf: [
    {
      if: {
        properties: {
          operation: { const: 'archive' },
        },
      },
      then: {
        required: ['archive'],
      },
    },
  ],
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateCreateCV(data) {
  return require('@utils').validateData(data, createCVBodySchema);
}

function validateUpdateCV(data) {
  return require('@utils').validateData(data, updateCVBodySchema);
}

function validateCVIdParams(data) {
  return require('@utils').validateData(data, cvIdParamsSchema);
}

function validateGetUserCVsQuery(data) {
  return require('@utils').validateData(data, getUserCVsQuerySchema);
}

function validateSearchCVsQuery(data) {
  return require('@utils').validateData(data, searchCVsQuerySchema);
}

function validateDuplicateCVBody(data) {
  return require('@utils').validateData(data, duplicateCVBodySchema);
}

function validateBulkOperationBody(data) {
  return require('@utils').validateData(data, bulkOperationBodySchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateCreateCVMiddleware = validateRequest(createCVBodySchema);
const validateUpdateCVMiddleware = validateRequest(updateCVBodySchema);
const validateCVIdParamsMiddleware = validateParams(cvIdParamsSchema);
const validateGetUserCVsQueryMiddleware = validateQuery(getUserCVsQuerySchema);
const validateSearchCVsQueryMiddleware = validateQuery(searchCVsQuerySchema);
const validateDuplicateCVBodyMiddleware = validateRequest(duplicateCVBodySchema);
const validateBulkOperationBodyMiddleware = validateRequest(bulkOperationBodySchema);

module.exports = {
  // Schemas
  cvContentSchema,
  createCVBodySchema,
  updateCVBodySchema,
  cvIdParamsSchema,
  getUserCVsQuerySchema,
  searchCVsQuerySchema,
  duplicateCVBodySchema,
  bulkOperationBodySchema,

  // Validation functions
  validateCreateCV,
  validateUpdateCV,
  validateCVIdParams,
  validateGetUserCVsQuery,
  validateSearchCVsQuery,
  validateDuplicateCVBody,
  validateBulkOperationBody,

  // Middleware
  validateCreateCVMiddleware,
  validateUpdateCVMiddleware,
  validateCVIdParamsMiddleware,
  validateGetUserCVsQueryMiddleware,
  validateSearchCVsQueryMiddleware,
  validateDuplicateCVBodyMiddleware,
  validateBulkOperationBodyMiddleware,
};
