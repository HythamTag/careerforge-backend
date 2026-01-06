/**
 * ============================================================================
 * index.js - Main Constants Export
 * ============================================================================
 * 
 * IMPORTANT: This file exports ONLY pure static constants.
 * For configuration-dependent values, use `require('@config')` directly.
 * 
 * @example
 * const { HTTP_STATUS, JOB_STATUS, ERROR_CODES } = require('@constants');
 * const config = require('@config'); // For runtime configuration
 */

// Core Constants
const HttpConstants = require('./core/http.constants');
const ErrorConstants = require('./core/error.constants');
const TimeConstants = require('./core/time.constants');
const ValidationConstants = require('./core/validation.constants');
const StatusConstants = require('./core/status.constants');
const TestConstants = require('./core/test.constants');

// Domain Constants
const JobConstants = require('./domain/job.constants');
const CVConstants = require('./domain/cv.constants');
const AtsConstants = require('./domain/ats.constants');
const WebhookConstants = require('./domain/webhook.constants');
const UserConstants = require('./domain/user.constants');
const TemplateConstants = require('./domain/template.constants');
const FileConstants = require('./domain/file.constants');
const AIConstants = require('./domain/ai.constants');

// Config Constants
const ServiceConstants = require('./config/service.constants');
const SecurityConstants = require('./config/security.constants');
const LimitsConstants = require('./config/limits.constants');

/**
 * Centralized constants export
 * All constants are pure static values with zero runtime dependencies
 */
module.exports = Object.freeze({
  // HTTP
  HTTP_STATUS: HttpConstants.HTTP_STATUS,
  HTTP_MESSAGES: HttpConstants.HTTP_MESSAGES,
  HTTP_STATUS_RANGES: HttpConstants.HTTP_STATUS_RANGES,
  SUCCESS_MESSAGES: HttpConstants.SUCCESS_MESSAGES,
  RESPONSE_MESSAGES: HttpConstants.RESPONSE_MESSAGES,

  // Status
  OPERATION_STATUS: StatusConstants.OPERATION_STATUS,
  HEALTH_STATUS: StatusConstants.HEALTH_STATUS,

  // Jobs
  JOB_STATUS: JobConstants.JOB_STATUS,
  JOB_STATUS_TRANSITIONS: JobConstants.JOB_STATUS_TRANSITIONS,
  JOB_TYPE: JobConstants.JOB_TYPE,
  JOB_PRIORITY: JobConstants.JOB_PRIORITY,
  JOB_PRIORITY_NAMES: JobConstants.JOB_PRIORITY_NAMES,
  JOB_LIMITS: JobConstants.JOB_LIMITS,
  JOB_RETRY_STRATEGY: JobConstants.JOB_RETRY_STRATEGY,
  JOB_EVENTS: JobConstants.JOB_EVENTS,
  CV_STATUS: JobConstants.CV_STATUS,
  PROGRESS_MILESTONES: JobConstants.PROGRESS_MILESTONES,
  CV_ENTITY_STATUS: JobConstants.CV_ENTITY_STATUS,
  GENERATION_STATUS: JobConstants.GENERATION_STATUS,
  GENERATION_TYPE: JobConstants.GENERATION_TYPE,
  OUTPUT_FORMAT: JobConstants.OUTPUT_FORMAT,
  ENHANCEMENT_STATUS: JobConstants.ENHANCEMENT_STATUS,
  ENHANCEMENT_TYPE: JobConstants.ENHANCEMENT_TYPE,
  ENHANCEMENT_PRIORITY: JobConstants.ENHANCEMENT_PRIORITY,
  ATS_STATUS: JobConstants.ATS_STATUS,
  ATS_TYPE: JobConstants.ATS_TYPE,
  ATS_PRIORITY: JobConstants.ATS_PRIORITY,
  WORKER_CONFIG: JobConstants.WORKER_CONFIG,
  WORKER_STATUS: JobConstants.WORKER_STATUS,
  WORKER: JobConstants.WORKER_CONFIG, // Alias for backward compatibility

  // Validation
  STRING_LIMITS: ValidationConstants.STRING_LIMITS,
  NUMERIC_LIMITS: ValidationConstants.NUMERIC_LIMITS,
  VALIDATION_PATTERNS: ValidationConstants.VALIDATION_PATTERNS,

  // Files
  FILE_TYPES: FileConstants.FILE_TYPES,
  FILE_LIMITS: FileConstants.FILE_LIMITS,
  STORAGE_TYPES: FileConstants.STORAGE_TYPES,
  DOCUMENT_FORMATTING: FileConstants.DOCUMENT_FORMATTING,
  TEXT_PROCESSING: FileConstants.TEXT_PROCESSING,
  ALLOWED_EXTENSIONS: FileConstants.ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES: FileConstants.ALLOWED_MIME_TYPES,
  EXTENSION_TO_MIME: FileConstants.EXTENSION_TO_MIME,
  PDF_PROCESSING: FileConstants.PDF_PROCESSING_CONFIG,

  // Errors
  ERROR_CODES: ErrorConstants.ERROR_CODES,
  ERROR_MESSAGES: ErrorConstants.ERROR_MESSAGES,
  VENDOR_ERROR_CODES: ErrorConstants.VENDOR_ERROR_CODES,

  // ATS
  ATS_SCORING_WEIGHTS: AtsConstants.ATS_SCORING_WEIGHTS,
  ATS_REQUIRED_SECTIONS: AtsConstants.ATS_REQUIRED_SECTIONS,
  ATS_OPTIONAL_SECTIONS: AtsConstants.ATS_OPTIONAL_SECTIONS,
  ATS_THRESHOLDS: AtsConstants.ATS_THRESHOLDS,
  ATS_TECHNICAL_KEYWORDS: AtsConstants.ATS_TECHNICAL_KEYWORDS,
  ATS_ACTION_VERBS: AtsConstants.ATS_ACTION_VERBS,
  CV_ATS: AtsConstants.CV_ATS_CONFIG,

  // Webhooks
  WEBHOOK_STATUS: WebhookConstants.WEBHOOK_STATUS,
  WEBHOOK_EVENT: WebhookConstants.WEBHOOK_EVENT,
  WEBHOOK_DELIVERY_STATUS: WebhookConstants.WEBHOOK_DELIVERY_STATUS,
  WEBHOOK_RETRY_CONFIG: WebhookConstants.WEBHOOK_RETRY_CONFIG,
  WEBHOOK_CONFIG: WebhookConstants.WEBHOOK_CONFIG,
  WEBHOOK: WebhookConstants.WEBHOOK_CONFIG, // Alias for backward compatibility
  WEBHOOK_VALIDATION: WebhookConstants.WEBHOOK_VALIDATION,

  // Templates
  TEMPLATES: TemplateConstants.TEMPLATES,
  CUSTOMIZATION: TemplateConstants.CUSTOMIZATION,
  DEFAULT_CUSTOMIZATION: TemplateConstants.DEFAULT_CUSTOMIZATION,

  // User
  USER_STATUS: UserConstants.USER_STATUS,
  USER_ROLE: UserConstants.USER_ROLE,
  SUBSCRIPTION_STATUS: UserConstants.SUBSCRIPTION_STATUS,
  VERSION_STATUS: UserConstants.VERSION_STATUS,
  VERSION_SOURCE: UserConstants.VERSION_SOURCE,

  // Time
  TIME_CONSTANTS: TimeConstants.TIME_CONSTANTS,

  // Service Metadata
  SERVICE_NAME: ServiceConstants.SERVICE_INFO.NAME,
  SERVICE_VERSION: ServiceConstants.SERVICE_INFO.VERSION,

  // Security
  CRYPTO: SecurityConstants.CRYPTO,
  LOGIN_SECURITY: SecurityConstants.LOGIN_SECURITY,

  // Limits & Quotas
  PAGINATION: LimitsConstants.PAGINATION,
  CLEANUP: LimitsConstants.CLEANUP,
  USER_LIMITS: LimitsConstants.USER_LIMITS,
  RETRY: LimitsConstants.RETRY_CONFIG,

  // Business Logic / Test Data
  MOCK_PROVIDER_DELAY_MS: TestConstants.MOCK_PROVIDER_DELAY_MS,
  PROCESSING: TestConstants.PROCESSING_SAMPLES,

  // CV Module
  CV_SOURCE: CVConstants.CV_SOURCE,
  CV_VERSION_CHANGE_TYPE: CVConstants.CV_VERSION_CHANGE_TYPE,
  CV_VERSION_NAMES: CVConstants.CV_VERSION_NAMES,
  CV_VERSION_DESCRIPTIONS: CVConstants.CV_VERSION_DESCRIPTIONS,
  CV_CONTENT_SECTIONS: CVConstants.CV_CONTENT_SECTIONS,
  CV_SETTINGS_DEFAULTS: CVConstants.CV_SETTINGS_DEFAULTS,
  CV_SETTINGS_OPTIONS: CVConstants.CV_SETTINGS_OPTIONS,
  CV_CONTENT_DEFAULTS: CVConstants.CV_CONTENT_DEFAULTS,
  CV_BULK_OPERATIONS: CVConstants.CV_BULK_OPERATIONS,
  CV_PUBLIC_URL: CVConstants.CV_PUBLIC_URL,
  CV_PROFICIENCY_LEVELS: CVConstants.CV_PROFICIENCY_LEVELS,
  CV_SORT_OPTIONS: CVConstants.CV_SORT_OPTIONS,
  RECOMMENDATIONS: CVConstants.RECOMMENDATIONS,
  OPTIMIZER_CONFIG: CVConstants.OPTIMIZER_CONFIG,

  // AI
  AI_PROVIDER_URLS: AIConstants.AI_PROVIDER_URLS,
  AI_API_VERSIONS: AIConstants.AI_API_VERSIONS,
});
