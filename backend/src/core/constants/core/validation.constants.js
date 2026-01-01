/**
 * ============================================================================
 * validation.constants.js - Input Validation Rules (Pure Static)
 * ============================================================================
 */

const STRING_LIMITS = Object.freeze({
  // Email
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 254, // RFC 5321

  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Names
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,

  // Phone
  PHONE_MIN_LENGTH: 7,
  PHONE_MAX_LENGTH: 20,

  // URLs
  URL_MAX_LENGTH: 2048,

  // Tokens
  TOKEN_MIN_LENGTH: 10,
  TOKEN_MAX_LENGTH: 1000,

  // Job-related
  JOB_ID_MIN_LENGTH: 10,
  JOB_ID_MAX_LENGTH: 100,
  JOB_TITLE_MAX_LENGTH: 200,
  COMPANY_NAME_MAX_LENGTH: 200,
  TARGET_ROLE_MAX_LENGTH: 200,
  JOB_DESCRIPTION_MAX_LENGTH: 10000,

  // Skills & Education
  SKILL_MIN_LENGTH: 2,
  SKILL_MAX_LENGTH: 100,
  DEGREE_MAX_LENGTH: 100,

  // Location & Organization
  LOCATION_MAX_LENGTH: 200,
  COMPANY_MAX_LENGTH: 200,
  POSITION_MAX_LENGTH: 200,
  INSTITUTION_MAX_LENGTH: 200,
  FIELD_MAX_LENGTH: 200,
  GPA_MAX_LENGTH: 10,
  HONOR_MAX_LENGTH: 200,
  CATEGORY_MAX_LENGTH: 100,
  PROJECT_NAME_MAX_LENGTH: 200,
  CERTIFICATION_MAX_LENGTH: 200,
  ISSUER_MAX_LENGTH: 200,
  CREDENTIAL_MAX_LENGTH: 200,
  LANGUAGE_MAX_LENGTH: 100,
  AUTHOR_MAX_LENGTH: 200,
  JOURNAL_MAX_LENGTH: 200,
  DOI_MAX_LENGTH: 100,
  LABEL_MAX_LENGTH: 100,
  AWARD_MAX_LENGTH: 200,
  ORGANIZATION_MAX_LENGTH: 200,
  ROLE_MAX_LENGTH: 200,
  TITLE_MAX_LENGTH: 200,
  TEMPLATE_MAX_LENGTH: 100,
  SEARCH_MAX_LENGTH: 200,
  TAGS_QUERY_MAX_LENGTH: 500,
  TAG_MAX_LENGTH: 50,

  // Text fields
  SUMMARY_MIN_LENGTH: 50,
  SUMMARY_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 2000,

  // Preview lengths (for logging and error messages)
  PREVIEW_MAX_LENGTH: 500,
  AI_RESPONSE_PREVIEW_LENGTH: 200,
  AI_MESSAGE_PREVIEW_LENGTH: 100,
  ID_PREVIEW_LENGTH: 8, // For correlation IDs, CV IDs, Job IDs in logs
  FILE_NAME_PREVIEW_LENGTH: 20, // For file names in logs
  CV_TITLE_PREVIEW_LENGTH: 50, // For CV titles in folder names

  // IDs (MongoDB ObjectId)
  OBJECT_ID_LENGTH: 24,
  MONGODB_ID_LENGTH: 24,

  // Files
  FILE_NAME_MAX_LENGTH: 255,
});

const NUMERIC_LIMITS = Object.freeze({
  // Pagination
  PAGE_MIN: 1,
  PAGE_MAX: 10000,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  DEFAULT_LIMIT: 20,
  DEFAULT_COUNT: 0,
  MAX_PAGE: 10000,
  MAX_LIMIT: 100,

  // Arrays
  MIN_ARRAY_LENGTH: 1,
  MIN_STRING_LENGTH: 1,
  MAX_JOB_REQUIREMENTS: 50,

  // Bulk operations
  BULK_MAX: 50,

  // Files
  FILE_SIZE_MAX: 10485760, // 10MB in bytes

  // Scores
  SCORE_MIN: 0,
  SCORE_MAX: 100,

  // Progress
  PROGRESS_MIN: 0,
  PROGRESS_MAX: 100,

  // Age & Experience
  AGE_MIN: 16,
  AGE_MAX: 100,
  EXPERIENCE_YEARS_MIN: 0,
  EXPERIENCE_YEARS_MAX: 70,
});

const VALIDATION_PATTERNS = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]{7,20}$/,
  URL: /^https?:\/\/.+/,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  MONGODB_OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
});

module.exports = {
  STRING_LIMITS,
  NUMERIC_LIMITS,
  VALIDATION_PATTERNS,
};
