/**
 * ============================================================================
 * limits.constants.js - Application Limits & Constraints (Pure Static)
 * ============================================================================
 */

const { TIME_CONSTANTS } = require('../core/time.constants');

/**
 * Pagination Configuration
 * Default pagination settings for list endpoints
 */
const PAGINATION = Object.freeze({
  /**
   * Default page number (1-indexed)
   */
  DEFAULT_PAGE: 1,

  /**
   * Default number of items per page
   * 20 items - good balance between performance and UX
   */
  DEFAULT_LIMIT: 20,

  /**
   * Limit for parsing history endpoints
   * 10 items - parsing history is typically shorter
   */
  PARSING_HISTORY_LIMIT: 10,

  /**
   * Maximum limit for generation endpoints
   * 100 items - prevents excessive resource usage
   */
  MAX_GENERATION_LIMIT: 100,
});

/**
 * User Account Limits
 * Per-user resource limits and quotas
 */
const USER_LIMITS = Object.freeze({
  /**
   * Maximum number of CVs a user can create
   * 10 CVs - reasonable limit for free tier
   */
  MAX_CVS: 10,

  /**
   * Maximum number of ATS analyses per user
   * 5 analyses - prevents abuse of AI analysis feature
   */
  MAX_ATS_ANALYSES: 5,

  /**
   * Maximum concurrent generation jobs
   * 3 jobs - prevents resource exhaustion
   */
  MAX_GENERATION_JOBS: 3,

  /**
   * Maximum storage per user in megabytes
   * 100MB - reasonable for CV documents
   */
  MAX_STORAGE_MB: 100,
});

/**
 * Cleanup Configuration
 * Data retention and cleanup policies
 */
const CLEANUP = Object.freeze({
  /**
   * Days before deleting old webhook delivery records
   * 30 days - balances storage with audit trail needs
   */
  WEBHOOK_DELIVERIES_DAYS_OLD: 30,

  /**
   * Days before cleaning up old job records
   * 30 days - keeps job history manageable
   */
  JOB_CLEANUP_DAYS_OLD: 30,

  /**
   * Grace period before cleanup (prevents premature deletion)
   * 24 hours - ensures jobs are truly finished before cleanup
   */
  JOB_GRACE_PERIOD_MS: TIME_CONSTANTS.MS_PER_DAY,

  /**
   * Minimum cleanup age (safety check)
   * 1 day - prevents accidental deletion of recent data
   */
  MIN_CLEANUP_DAYS: 1,
});

/**
 * Retry Configuration
 * Default retry settings for operations
 */
const RETRY_CONFIG = Object.freeze({
  /**
   * Default maximum number of retry attempts
   * 2 retries - balances reliability with performance
   */
  DEFAULT_MAX_RETRIES: 2,

  /**
   * Initial delay before first retry in milliseconds
   * 1 second - quick retry for transient failures
   */
  DEFAULT_INITIAL_DELAY: 1000,
});

module.exports = {
  PAGINATION,
  USER_LIMITS,
  CLEANUP,
  RETRY_CONFIG,
};

