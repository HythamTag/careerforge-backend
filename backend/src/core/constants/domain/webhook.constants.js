/**
 * WEBHOOK CONSTANTS
 *
 * Centralized constants for webhook management, events, and delivery.
 *
 * @module core/constants/webhook.constants
 */

/**
 * Webhook Status
 */
const WEBHOOK_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  FAILED: 'failed',
});

/**
 * Webhook Event Types
 */
const WEBHOOK_EVENT = Object.freeze({
  // Job Events
  JOB_CREATED: 'job.created',
  JOB_STARTED: 'job.started',
  JOB_COMPLETED: 'job.completed',
  JOB_FAILED: 'job.failed',
  JOB_CANCELLED: 'job.cancelled',

  // Generation Events
  GENERATION_COMPLETED: 'generation.completed',
  GENERATION_FAILED: 'generation.failed',

  // Enhancement Events
  ENHANCEMENT_COMPLETED: 'enhancement.completed',
  ENHANCEMENT_FAILED: 'enhancement.failed',

  // ATS Analysis Events
  ATS_COMPLETED: 'ats.completed',
  ATS_FAILED: 'ats.failed',

  // CV Parsing Events
  PARSING_COMPLETED: 'parsing.completed',
  PARSING_FAILED: 'parsing.failed',

  // Version Events
  VERSION_CREATED: 'version.created',
  VERSION_UPDATED: 'version.updated',
  VERSION_DELETED: 'version.deleted',

  // CV Events
  CV_CREATED: 'cv.created',
  CV_UPDATED: 'cv.updated',
  CV_DELETED: 'cv.deleted',

  // User Events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
});

/**
 * Webhook Delivery Status
 */
const WEBHOOK_DELIVERY_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  RETRYING: 'retrying',
  EXHAUSTED: 'exhausted',
  RETRY_QUEUED: 'retry_queued',
  RETRY_FAILED: 'retry_failed',
});

/**
 * Webhook Retry Configuration
 */
const WEBHOOK_RETRY_CONFIG = Object.freeze({
  MAX_RETRIES: 5,
  BASE_DELAY_MS: 1000, // 1 second
  MAX_DELAY_MS: 300000, // 5 minutes
  BACKOFF_MULTIPLIER: 2,
});

/**
 * Webhook Configuration
 * Settings for webhook delivery and retry logic
 */
const WEBHOOK_CONFIG = Object.freeze({
  URL_MAX_LENGTH: 500,
  SECRET_MAX_LENGTH: 100,
  SIGNATURE_MAX_LENGTH: 128,
  USER_AGENT_MAX_LENGTH: 500,

  /**
   * Maximum retry attempts for failed webhook deliveries
   * 10 attempts - ensures delivery without infinite retries
   */
  MAX_RETRY_ATTEMPTS: 10,

  /**
   * Base delay before first retry (1 second)
   * Exponential backoff starts from this value
   */
  BASE_RETRY_DELAY_MS: 1000,

  /**
   * Maximum retry delay cap (5 minutes)
   * Prevents excessive delays in exponential backoff
   */
  MAX_RETRY_DELAY_MS: 300000,

  /**
   * Default webhook request timeout (30 seconds)
   * Standard timeout for HTTP webhook calls
   */
  DEFAULT_TIMEOUT_MS: 30000,

  MIN_TIMEOUT_MS: 5000,
  MAX_TIMEOUT_MS: 120000,

  /**
   * Multiplier for converting success rate to percentage
   * 100 - converts 0.85 to 85%
   */
  SUCCESS_RATE_MULTIPLIER: 100,

  /**
   * Divisor for bulk retry delay calculation
   * 2 - halves delay for bulk operations to speed up processing
   */
  BULK_RETRY_DIVISOR: 2,
});

/**
 * Webhook Validation Configuration
 * Validation rules and thresholds for webhook configuration
 */
const WEBHOOK_VALIDATION = Object.freeze({
  /**
   * Maximum allowed retry attempts value
   * 100 - prevents excessive retry configurations
   */
  MAX_ATTEMPTS_VALUE: 100,

  /**
   * Maximum allowed delay value (in seconds)
   * 100 seconds - reasonable upper limit for retry delays
   */
  MAX_DELAY_VALUE: 100,

  /**
   * Minimum success rate threshold for webhook health (percentage)
   * 80% - webhooks below this are considered unhealthy
   */
  SUCCESS_RATE_THRESHOLD: 80,
});

module.exports = {
  WEBHOOK_STATUS,
  WEBHOOK_EVENT,
  WEBHOOK_DELIVERY_STATUS,
  WEBHOOK_RETRY_CONFIG,
  WEBHOOK_CONFIG,
  WEBHOOK_VALIDATION,
};
