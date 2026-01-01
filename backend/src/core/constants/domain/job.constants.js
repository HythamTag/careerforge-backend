/**
 * ============================================================================
 * job.constants.js - Job System Constants (Pure Static)
 * ============================================================================
 */

/**
 * @typedef {'pending'|'queued'|'processing'|'completed'|'failed'|'cancelled'|'retrying'|'timeout'} JobStatus
 */

/**
 * Job statuses following a clear state machine
 */
const JOB_STATUS = Object.freeze({
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying',
  TIMEOUT: 'timeout',
});

/**
 * Valid job status transitions (state machine)
 */
const JOB_STATUS_TRANSITIONS = Object.freeze({
  [JOB_STATUS.PENDING]: [JOB_STATUS.QUEUED, JOB_STATUS.CANCELLED],
  [JOB_STATUS.QUEUED]: [JOB_STATUS.PROCESSING, JOB_STATUS.CANCELLED, JOB_STATUS.TIMEOUT],
  [JOB_STATUS.PROCESSING]: [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED, JOB_STATUS.TIMEOUT],
  [JOB_STATUS.FAILED]: [JOB_STATUS.RETRYING, JOB_STATUS.CANCELLED],
  [JOB_STATUS.RETRYING]: [JOB_STATUS.QUEUED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED],
  [JOB_STATUS.COMPLETED]: [],
  [JOB_STATUS.CANCELLED]: [],
  [JOB_STATUS.TIMEOUT]: [JOB_STATUS.RETRYING, JOB_STATUS.FAILED],
});

/**
 * Job types - domain-specific job categories
 */
const JOB_TYPE = Object.freeze({
  CV_PARSING: 'cv_parsing',
  CV_OPTIMIZATION: 'cv_optimization',
  CV_GENERATION: 'cv_generation',
  CV_ENHANCEMENT: 'cv_enhancement',
  ATS_ANALYSIS: 'ats_analysis',
  WEBHOOK_DELIVERY: 'webhook_delivery',
  EMAIL_NOTIFICATION: 'email_notification',
  DOCUMENT_EXPORT: 'document_export',
});

/**
 * Job priorities (numeric values for queue priority)
 * Higher number = higher priority
 */
const JOB_PRIORITY = Object.freeze({
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
  CRITICAL: 50,
});

/**
 * Job priority name mapping
 */
const JOB_PRIORITY_NAMES = Object.freeze({
  [JOB_PRIORITY.LOW]: 'low',
  [JOB_PRIORITY.NORMAL]: 'normal',
  [JOB_PRIORITY.HIGH]: 'high',
  [JOB_PRIORITY.URGENT]: 'urgent',
  [JOB_PRIORITY.CRITICAL]: 'critical',
});

/**
 * Job configuration limits
 */
const JOB_LIMITS = Object.freeze({
  MAX_RETRIES: 10,
  DEFAULT_RETRIES: 3,
  MIN_RETRIES: 0,
  MAX_DELAY_MS: 86400000, // 24 hours
  MAX_TIMEOUT_MS: 3600000, // 1 hour
  DEFAULT_TIMEOUT_MS: 300000, // 5 minutes
  DEFAULT_RETRY_DELAY_MS: 60000, // 1 minute (60 seconds)
  STUCK_JOB_TIMEOUT_MINUTES: 30, // 30 minutes for stuck job detection
  MAX_CONCURRENT_JOBS: 100,
  MAX_BULK_OPERATION_SIZE: 1000,
});

/**
 * Job retry strategies
 */
const JOB_RETRY_STRATEGY = Object.freeze({
  EXPONENTIAL: 'exponential',
  LINEAR: 'linear',
  FIXED: 'fixed',
});

/**
 * Job lifecycle events
 */
const JOB_EVENTS = Object.freeze({
  CREATED: 'job.created',
  QUEUED: 'job.queued',
  STARTED: 'job.started',
  PROGRESS: 'job.progress',
  COMPLETED: 'job.completed',
  FAILED: 'job.failed',
  CANCELLED: 'job.cancelled',
  RETRYING: 'job.retrying',
  TIMEOUT: 'job.timeout',
  DELETED: 'job.deleted',
});

/**
 * CV processing statuses
 */
const CV_STATUS = Object.freeze({
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  PARSED: 'parsed',
  OPTIMIZED: 'optimized',
  FAILED: 'failed',
});

/**
 * Job progress milestones (percentage)
 */
const PROGRESS_MILESTONES = Object.freeze({
  UPLOAD_START: 10,
  TEXT_EXTRACTION: 20,
  CLEANING_COMPLETE: 40,
  AI_PROCESSING: 60,
  VALIDATION_COMPLETE: 80,
  SAVING_DATA: 90,
  COMPLETE: 100,
});

/**
 * CV Entity Status (for CV records, not processing jobs)
 */
const CV_ENTITY_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  PROCESSING: 'processing',
  FAILED: 'failed',
  DELETED: 'deleted',
});

/**
 * CV Generation Status
 */
const GENERATION_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
});

/**
 * CV Generation Type
 */
const GENERATION_TYPE = Object.freeze({
  FROM_CV: 'from_cv',
  FROM_TEMPLATE: 'from_template',
  CUSTOM: 'custom',
  BULK: 'bulk',
});

/**
 * CV Output Format
 */
const OUTPUT_FORMAT = Object.freeze({
  PDF: 'pdf',
  HTML: 'html',
  DOCX: 'docx',
  JSON: 'json',
  TXT: 'txt',
});

/**
 * Enhancement Job Status
 */
const ENHANCEMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
});

/**
 * Enhancement Type
 */
const ENHANCEMENT_TYPE = Object.freeze({
  OPTIMIZE: 'optimize',
  REWRITE: 'rewrite',
  EXPAND: 'expand',
  SHORTEN: 'shorten',
  KEYWORDS: 'keywords',
  IMPACT: 'impact',
  STRUCTURE: 'structure',
  TAILOR: 'tailor',
});

/**
 * Enhancement Priority
 */
const ENHANCEMENT_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

/**
 * ATS Analysis Status
 */
const ATS_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
});

/**
 * ATS Analysis Type
 */
const ATS_TYPE = Object.freeze({
  COMPATIBILITY: 'compatibility',
  KEYWORD_ANALYSIS: 'keyword_analysis',
  FORMAT_CHECK: 'format_check',
  COMPREHENSIVE: 'comprehensive',
});

/**
 * ATS Priority
 */
const ATS_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

/**
 * Worker Process Configuration
 * Settings for background worker processes
 */
const WORKER_CONFIG = Object.freeze({
  /**
   * Delay before restarting a crashed worker (5 seconds)
   * Prevents rapid restart loops
   */
  RESTART_DELAY_MS: 5000,

  /**
   * Wait time during worker startup (2 seconds)
   * Allows services to initialize properly
   */
  STARTUP_WAIT_MS: 2000,

  /**
   * Maximum time to wait for graceful shutdown (30 seconds)
   * After this, force kill the worker
   */
  SHUTDOWN_TIMEOUT_MS: 30000,
});

/**
 * Worker Status States
 * Possible states for background worker processes
 */
const WORKER_STATUS = Object.freeze({
  RUNNING: 'running',
  STOPPED: 'stopped',
  STARTING: 'starting',
  STOPPING: 'stopping',
  CRASHED: 'crashed',
});

module.exports = {
  JOB_STATUS,
  JOB_STATUS_TRANSITIONS,
  JOB_TYPE,
  JOB_PRIORITY,
  JOB_PRIORITY_NAMES,
  JOB_LIMITS,
  JOB_RETRY_STRATEGY,
  JOB_EVENTS,
  CV_STATUS,
  PROGRESS_MILESTONES,
  CV_ENTITY_STATUS,
  GENERATION_STATUS,
  GENERATION_TYPE,
  OUTPUT_FORMAT,
  ENHANCEMENT_STATUS,
  ENHANCEMENT_TYPE,
  ENHANCEMENT_PRIORITY,
  ATS_STATUS,
  ATS_TYPE,
  ATS_PRIORITY,
  WORKER_CONFIG,
  WORKER_STATUS,
};
