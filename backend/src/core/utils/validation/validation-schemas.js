/**
 * ============================================================================
 * validation-schemas.js - Common Validation Schemas
 * ============================================================================
 *
 * Reusable Joi validation schemas for common patterns across the application.
 */

const Joi = require('joi');
const { STRING_LIMITS, NUMERIC_LIMITS, VALIDATION_PATTERNS, JOB_STATUS } = require('@constants');

const DATE_RANGE_FIELDS = {
  startDate: Joi.string().pattern(/^\d{4}(-\d{2})?(-\d{2})?$/).required(),
  endDate: Joi.string().pattern(/^\d{4}(-\d{2})?(-\d{2})?$/),
  isCurrent: Joi.boolean(),
};

const PAGINATION_FIELDS = {
  page: Joi.number().integer().min(NUMERIC_LIMITS.PAGE_MIN).max(NUMERIC_LIMITS.PAGE_MAX).default(1),
  limit: Joi.number().integer().min(NUMERIC_LIMITS.LIMIT_MIN).max(NUMERIC_LIMITS.LIMIT_MAX).default(NUMERIC_LIMITS.DEFAULT_LIMIT),
  sort: Joi.string(),
};

/**
 * Common field validation schemas
 */
const COMMON_SCHEMAS = Object.freeze({
  // Basic string fields
  name: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.NAME_MAX_LENGTH).trim(),
  email: Joi.string().email().min(STRING_LIMITS.EMAIL_MIN_LENGTH).max(STRING_LIMITS.EMAIL_MAX_LENGTH),
  phone: Joi.string().pattern(VALIDATION_PATTERNS.PHONE).min(STRING_LIMITS.PHONE_MIN_LENGTH).max(STRING_LIMITS.PHONE_MAX_LENGTH),
  url: Joi.string().uri().max(STRING_LIMITS.URL_MAX_LENGTH),

  // Dates
  dateString: Joi.string().pattern(/^\d{4}(-\d{2})?(-\d{2})?$/),
  dateRange: Joi.object(DATE_RANGE_FIELDS),

  // Job-related
  jobTitle: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.JOB_TITLE_MAX_LENGTH).trim(),
  companyName: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.COMPANY_MAX_LENGTH).trim(),
  jobDescription: Joi.string().min(STRING_LIMITS.SKILL_MIN_LENGTH).max(STRING_LIMITS.JOB_DESCRIPTION_MAX_LENGTH).trim(),

  // Skills and education
  skill: Joi.string().min(STRING_LIMITS.SKILL_MIN_LENGTH).max(STRING_LIMITS.SKILL_MAX_LENGTH).trim(),
  degree: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.DEGREE_MAX_LENGTH).trim(),
  institution: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.INSTITUTION_MAX_LENGTH).trim(),

  // Location and organization
  location: Joi.string().max(STRING_LIMITS.LOCATION_MAX_LENGTH).trim(),

  // IDs
  objectId: Joi.string().pattern(VALIDATION_PATTERNS.MONGODB_OBJECT_ID),
  jobId: Joi.string().min(STRING_LIMITS.JOB_ID_MIN_LENGTH).max(STRING_LIMITS.JOB_ID_MAX_LENGTH),

  // Pagination
  pagination: Joi.object(PAGINATION_FIELDS),

  // Common arrays
  skillsArray: Joi.array().items(
    Joi.string().min(STRING_LIMITS.SKILL_MIN_LENGTH).max(STRING_LIMITS.SKILL_MAX_LENGTH).trim()
  ).max(NUMERIC_LIMITS.BULK_MAX),

  stringArray: (maxItems = 20) => Joi.array().items(Joi.string().trim()).max(maxItems),

  // File validation
  fileName: Joi.string().max(STRING_LIMITS.FILE_NAME_MAX_LENGTH).pattern(/^[a-zA-Z0-9._\-\s]+$/),
});

/**
 * Complex composite schemas
 */
const COMPOSITE_SCHEMAS = Object.freeze({
  // Experience entry
  experience: Joi.object({
    company: COMMON_SCHEMAS.companyName.required(),
    position: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.POSITION_MAX_LENGTH).trim().required(),
    ...DATE_RANGE_FIELDS,
    description: Joi.string().max(STRING_LIMITS.DESCRIPTION_MAX_LENGTH).trim(),
    technologies: COMMON_SCHEMAS.skillsArray,
    achievements: COMMON_SCHEMAS.stringArray(),
    location: COMMON_SCHEMAS.location,
    isCurrent: Joi.boolean(),
  }),

  // Education entry
  education: Joi.object({
    institution: COMMON_SCHEMAS.institution.required(),
    degree: COMMON_SCHEMAS.degree.required(),
    field: Joi.string().max(STRING_LIMITS.FIELD_MAX_LENGTH).trim(),
    ...DATE_RANGE_FIELDS,
    gpa: Joi.string().max(STRING_LIMITS.GPA_MAX_LENGTH).trim(),
    honors: COMMON_SCHEMAS.stringArray(),
    location: COMMON_SCHEMAS.location,
  }),

  // Project entry
  project: Joi.object({
    name: Joi.string().min(STRING_LIMITS.NAME_MIN_LENGTH).max(STRING_LIMITS.PROJECT_NAME_MAX_LENGTH).trim().required(),
    description: Joi.string().max(STRING_LIMITS.DESCRIPTION_MAX_LENGTH).trim(),
    technologies: COMMON_SCHEMAS.skillsArray,
    url: COMMON_SCHEMAS.url,
    repository: COMMON_SCHEMAS.url,
    ...DATE_RANGE_FIELDS,
  }),

  // Personal information
  personal: Joi.object({
    name: COMMON_SCHEMAS.name,
    email: COMMON_SCHEMAS.email,
    phone: COMMON_SCHEMAS.phone,
    location: COMMON_SCHEMAS.location,
    linkedin: COMMON_SCHEMAS.url,
    website: COMMON_SCHEMAS.url,
    summary: Joi.string().min(STRING_LIMITS.SUMMARY_MIN_LENGTH).max(STRING_LIMITS.SUMMARY_MAX_LENGTH).trim(),
  }),

  // Job target
  jobTarget: Joi.object({
    title: COMMON_SCHEMAS.jobTitle.required(),
    company: COMMON_SCHEMAS.companyName,
    description: COMMON_SCHEMAS.jobDescription,
    requirements: COMMON_SCHEMAS.skillsArray,
    location: COMMON_SCHEMAS.location,
  }),
});

/**
 * API parameter validation schemas
 */
const API_SCHEMAS = Object.freeze({
  // Object ID parameter
  objectIdParam: Joi.object({
    id: COMMON_SCHEMAS.objectId.required(),
  }),

  // Query parameters
  paginationQuery: COMMON_SCHEMAS.pagination,

  // Search query
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(STRING_LIMITS.SEARCH_MAX_LENGTH).trim(),
    ...PAGINATION_FIELDS,
  }),

  // Filter queries
  statusFilter: Joi.object({
    status: Joi.string().valid(
      JOB_STATUS.PENDING,
      JOB_STATUS.PROCESSING,
      JOB_STATUS.COMPLETED,
      JOB_STATUS.FAILED,
      JOB_STATUS.CANCELLED,
    ),
  }),
});

module.exports = {
  COMMON_SCHEMAS,
  COMPOSITE_SCHEMAS,
  API_SCHEMAS,
};

