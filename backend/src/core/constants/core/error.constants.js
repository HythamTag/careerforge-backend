/**
 * ============================================================================
 * error.constants.js - Application Error Codes (Pure Static)
 * ============================================================================
 * 
 * Error Code Numbering Scheme:
 * - 1xxx: Generic/Common errors
 * - 2xxx: Job-related errors
 * - 3xxx: File operation errors
 * - 4xxx: CV errors
 *   - 41xx: CV Generation subdomain
 * - 5xxx: Database errors
 * - 6xxx: External service errors (AI, Storage, Email, Webhook)
 * - 7xxx: Authentication/Authorization errors
 * - 8xxx: User management errors
 * - 9xxx: Webhook errors
 * - 10xxx: ATS analysis errors
 * - 11xxx: Enhancement errors
 * - 12xxx: Parsing job errors
 * - 13xxx: Version control errors
 * 
 * Naming Convention:
 * - Entity-specific: {ENTITY}_NOT_FOUND (e.g., CV_NOT_FOUND, USER_NOT_FOUND)
 * - Job-specific: {DOMAIN}_JOB_NOT_FOUND (e.g., GENERATION_JOB_NOT_FOUND)
 * - This distinguishes between entity lookups and job lookups
 */

const ERROR_CODES = Object.freeze({
  // Generic errors (1xxx)
  UNKNOWN_ERROR: 'ERR_1000',
  VALIDATION_ERROR: 'ERR_1001',
  NOT_FOUND: 'ERR_1002',
  UNAUTHORIZED: 'ERR_1003',
  FORBIDDEN: 'ERR_1004',
  CONFLICT: 'ERR_1005',
  RATE_LIMIT_EXCEEDED: 'ERR_1006',
  INVALID_JOB_TYPE: 'ERR_1007',
  INVALID_JOB_OPTIONS: 'ERR_1008',
  INVALID_PRIORITY: 'ERR_1009',
  INVALID_JOB_ID: 'ERR_1010',
  MISSING_USER_ID: 'ERR_1011',
  MISSING_ENTITY_ID: 'ERR_1012',
  INVALID_TAGS: 'ERR_1013',
  INVALID_STATUS: 'ERR_1014',
  INVALID_PROGRESS: 'ERR_1015',
  INVALID_STEPS: 'ERR_1016',
  CONFIGURATION_ERROR: 'ERR_1017',

  // Job errors (2xxx)
  JOB_NOT_FOUND: 'ERR_2001',
  JOB_CREATION_FAILED: 'ERR_2002',
  JOB_UPDATE_FAILED: 'ERR_2003',
  JOB_INVALID_STATE: 'ERR_2004',
  JOB_MAX_RETRIES_EXCEEDED: 'ERR_2005',
  JOB_TIMEOUT: 'ERR_2006',
  JOB_QUEUE_ERROR: 'ERR_2007',
  JOB_INVALID_DEPS: 'ERR_2008',
  JOB_MISSING_DEPENDENCY: 'ERR_2009',
  JOB_NO_QUEUE_SERVICE: 'ERR_2010',
  JOB_INVALID_CLEANUP_DAYS: 'ERR_2011',

  // File errors (3xxx)
  FILE_TOO_LARGE: 'ERR_3001',
  FILE_INVALID_TYPE: 'ERR_3002',
  FILE_UPLOAD_FAILED: 'ERR_3003',
  FILE_NOT_FOUND: 'ERR_3004',
  FILE_EXTRACTION_FAILED: 'ERR_3005',
  FILE_CORRUPTED: 'ERR_3006',

  // CV errors (4xxx)
  CV_NOT_FOUND: 'ERR_4001',
  CV_PARSING_FAILED: 'ERR_4002',
  CV_INVALID_FORMAT: 'ERR_4003',
  CV_OPTIMIZATION_FAILED: 'ERR_4004',
  CV_UPDATE_INVALID: 'ERR_4005',
  CV_DELETE_DENIED: 'ERR_4006',
  CV_FILE_EXISTS: 'ERR_4007',
  CV_FILE_MISSING: 'ERR_4008',
  CV_ACCESS_DENIED: 'ERR_4009',
  CV_NO_FILE_TO_PARSE: 'ERR_4010',

  // CV Generation errors (4xxx)
  GENERATION_INVALID_FORMAT: 'ERR_4101',
  GENERATION_MISSING_DATA: 'ERR_4102',
  GENERATION_JOB_NOT_FOUND: 'ERR_4103',
  GENERATION_JOB_INCOMPLETE: 'ERR_4104',
  GENERATION_JOB_CANCEL_DENIED: 'ERR_4105',
  GENERATION_BULK_INVALID: 'ERR_4106',
  GENERATION_BULK_LIMIT_EXCEEDED: 'ERR_4107',
  TEMPLATE_NOT_FOUND: 'ERR_4108',
  GENERATION_FAILED: 'ERR_4109',

  // Database errors (5xxx)
  DB_CONNECTION_FAILED: 'ERR_5001',
  DB_QUERY_FAILED: 'ERR_5002',
  DB_DUPLICATE_KEY: 'ERR_5003',
  DB_TRANSACTION_FAILED: 'ERR_5004',

  // External service errors (6xxx)
  AI_SERVICE_ERROR: 'ERR_6001',
  AI_TIMEOUT: 'ERR_6002',
  AI_RATE_LIMIT: 'ERR_6003',
  AI_INVALID_RESPONSE: 'ERR_6007',
  STORAGE_SERVICE_ERROR: 'ERR_6004',
  EMAIL_SERVICE_ERROR: 'ERR_6005',
  WEBHOOK_DELIVERY_FAILED: 'ERR_6006',

  // Authentication errors (7xxx)
  AUTH_INVALID_TOKEN: 'ERR_7001',
  AUTH_TOKEN_EXPIRED: 'ERR_7002',
  AUTH_INVALID_CREDENTIALS: 'ERR_7003',
  AUTH_SESSION_EXPIRED: 'ERR_7004',
  AUTH_ACCOUNT_INACTIVE: 'ERR_7005',
  AUTH_CURRENT_PASSWORD_INCORRECT: 'ERR_7006',
  AUTH_EMAIL_ALREADY_EXISTS: 'ERR_7007',
  AUTH_MISSING_REQUIRED_FIELDS: 'ERR_7008',
  AUTH_REFRESH_TOKEN_INVALID: 'ERR_7009',
  AUTH_REFRESH_TOKEN_EXPIRED: 'ERR_7010',
  AUTH_RESET_TOKEN_INVALID: 'ERR_7011',
  AUTH_VERIFICATION_TOKEN_INVALID: 'ERR_7012',
  AUTH_EMAIL_ALREADY_VERIFIED: 'ERR_7013',

  // User errors (8xxx)
  USER_NOT_FOUND: 'ERR_8001',
  USER_AVATAR_UPLOAD_FAILED: 'ERR_8002',
  USER_AVATAR_DELETE_FAILED: 'ERR_8003',
  USER_ACCOUNT_DELETE_FAILED: 'ERR_8004',
  USER_FILE_SERVICE_UNAVAILABLE: 'ERR_8005',
  USER_INVALID_FILE_TYPE: 'ERR_8006',
  USER_FILE_TOO_LARGE: 'ERR_8007',
  USER_INVALID_REFERRAL_CODE: 'ERR_8008',

  // Webhook errors (9xxx)
  WEBHOOK_NOT_FOUND: 'ERR_9001',
  WEBHOOK_DELIVERY_NOT_FOUND: 'ERR_9002',
  WEBHOOK_DELIVERY_INVALID: 'ERR_9003',
  WEBHOOK_DELIVERY_SUCCESSFUL: 'ERR_9004',
  WEBHOOK_INACTIVE: 'ERR_9005',

  // ATS Analysis errors (10xxx)
  ATS_JOB_NOT_FOUND: 'ERR_10001',
  ATS_JOB_INCOMPLETE: 'ERR_10002',
  ATS_JOB_CANCEL_DENIED: 'ERR_10003',

  // Enhancement errors (11xxx)
  ENHANCEMENT_INVALID_TYPE: 'ERR_11001',
  ENHANCEMENT_MISSING_CONTENT: 'ERR_11002',
  ENHANCEMENT_JOB_NOT_FOUND: 'ERR_11003',
  ENHANCEMENT_JOB_INCOMPLETE: 'ERR_11004',
  ENHANCEMENT_JOB_CANCEL_DENIED: 'ERR_11005',
  ENHANCEMENT_BULK_INVALID: 'ERR_11006',
  ENHANCEMENT_BULK_LIMIT_EXCEEDED: 'ERR_11007',

  // CV Parsing errors (12xxx)
  PARSING_JOB_NOT_FOUND: 'ERR_12001',
  CV_PARSING_JOB_INCOMPLETE: 'ERR_12002',
  CV_PARSING_NO_RESULT: 'ERR_12003',
  CV_PARSING_CANCEL_DENIED: 'ERR_12004',
  JOB_NOT_COMPLETED: 'ERR_12005',
  INVALID_JOB_DATA: 'ERR_12006',

  // Version errors (13xxx)
  VERSION_NOT_FOUND: 'ERR_13001',
  VERSION_MODIFY_ACTIVE: 'ERR_13002',
  VERSION_ALREADY_ACTIVE: 'ERR_13003',
  VERSION_DELETE_ACTIVE: 'ERR_13004',
});

const ERROR_MESSAGES = Object.freeze({
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.CONFLICT]: 'Resource conflict',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ERROR_CODES.INVALID_JOB_TYPE]: 'Invalid job type',
  [ERROR_CODES.INVALID_JOB_OPTIONS]: 'Invalid job options',
  [ERROR_CODES.INVALID_PRIORITY]: 'Invalid priority',
  [ERROR_CODES.INVALID_JOB_ID]: 'Invalid job ID',
  [ERROR_CODES.MISSING_USER_ID]: 'User ID is required',
  [ERROR_CODES.MISSING_ENTITY_ID]: 'Entity ID is required',
  [ERROR_CODES.INVALID_TAGS]: 'Tags must be an array',
  [ERROR_CODES.INVALID_STATUS]: 'Invalid status',
  [ERROR_CODES.INVALID_PROGRESS]: 'Invalid progress value',
  [ERROR_CODES.INVALID_STEPS]: 'Invalid step values',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'Configuration error',

  [ERROR_CODES.JOB_NOT_FOUND]: 'Job not found',
  [ERROR_CODES.JOB_CREATION_FAILED]: 'Failed to create job',
  [ERROR_CODES.JOB_INVALID_STATE]: 'Invalid job state transition',
  [ERROR_CODES.JOB_MAX_RETRIES_EXCEEDED]: 'Maximum retry attempts exceeded',
  [ERROR_CODES.JOB_TIMEOUT]: 'Job execution timeout',
  [ERROR_CODES.JOB_QUEUE_ERROR]: 'Job queue error',
  [ERROR_CODES.JOB_INVALID_DEPS]: 'Invalid dependencies object',
  [ERROR_CODES.JOB_MISSING_DEPENDENCY]: 'Missing required dependency',
  [ERROR_CODES.JOB_NO_QUEUE_SERVICE]: 'Queue service not available',
  [ERROR_CODES.JOB_INVALID_CLEANUP_DAYS]: 'Invalid cleanup days value',

  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Invalid file type',
  [ERROR_CODES.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found',

  [ERROR_CODES.CV_NOT_FOUND]: 'CV not found',
  [ERROR_CODES.CV_PARSING_FAILED]: 'Failed to parse CV',
  [ERROR_CODES.CV_INVALID_FORMAT]: 'Invalid CV format',
  [ERROR_CODES.CV_UPDATE_INVALID]: 'No valid fields to update',
  [ERROR_CODES.CV_DELETE_DENIED]: 'Deletion requires confirmation',
  [ERROR_CODES.CV_FILE_EXISTS]: 'CV already has a file',
  [ERROR_CODES.CV_FILE_MISSING]: 'CV file not found',
  [ERROR_CODES.CV_ACCESS_DENIED]: 'Access denied to CV',
  [ERROR_CODES.CV_NO_FILE_TO_PARSE]: 'CV has no file to parse',

  [ERROR_CODES.GENERATION_INVALID_FORMAT]: 'Invalid output format',
  [ERROR_CODES.GENERATION_MISSING_DATA]: 'CV ID or input data is required',
  [ERROR_CODES.GENERATION_JOB_NOT_FOUND]: 'Generation job not found',
  [ERROR_CODES.GENERATION_JOB_INCOMPLETE]: 'Generation job is not completed yet',
  [ERROR_CODES.GENERATION_JOB_CANCEL_DENIED]: 'Cannot cancel generation job',
  [ERROR_CODES.GENERATION_BULK_INVALID]: 'Generations array is required',
  [ERROR_CODES.GENERATION_BULK_LIMIT_EXCEEDED]: 'Maximum generations limit exceeded',
  [ERROR_CODES.TEMPLATE_NOT_FOUND]: 'Template not found',
  [ERROR_CODES.GENERATION_FAILED]: 'Generation failed',

  [ERROR_CODES.WEBHOOK_NOT_FOUND]: 'Webhook not found',
  [ERROR_CODES.WEBHOOK_DELIVERY_NOT_FOUND]: 'Webhook delivery not found',
  [ERROR_CODES.WEBHOOK_DELIVERY_INVALID]: 'Delivery does not belong to this webhook',
  [ERROR_CODES.WEBHOOK_DELIVERY_SUCCESSFUL]: 'Delivery is already successful',
  [ERROR_CODES.WEBHOOK_INACTIVE]: 'Webhook is not active',

  [ERROR_CODES.ATS_JOB_NOT_FOUND]: 'ATS analysis job not found',
  [ERROR_CODES.ATS_JOB_INCOMPLETE]: 'ATS analysis job is not completed yet',
  [ERROR_CODES.ATS_JOB_CANCEL_DENIED]: 'Cannot cancel ATS analysis job',

  [ERROR_CODES.ENHANCEMENT_INVALID_TYPE]: 'Invalid enhancement type',
  [ERROR_CODES.ENHANCEMENT_MISSING_CONTENT]: 'Input content is required',
  [ERROR_CODES.ENHANCEMENT_JOB_NOT_FOUND]: 'Enhancement job not found',
  [ERROR_CODES.ENHANCEMENT_JOB_INCOMPLETE]: 'Enhancement job is not completed yet',
  [ERROR_CODES.ENHANCEMENT_JOB_CANCEL_DENIED]: 'Cannot cancel enhancement job',
  [ERROR_CODES.ENHANCEMENT_BULK_INVALID]: 'Enhancements array is required',
  [ERROR_CODES.ENHANCEMENT_BULK_LIMIT_EXCEEDED]: 'Maximum enhancements limit exceeded',

  [ERROR_CODES.PARSING_JOB_NOT_FOUND]: 'Parsing job not found',
  [ERROR_CODES.CV_PARSING_JOB_INCOMPLETE]: 'Parsing job is not completed yet',
  [ERROR_CODES.CV_PARSING_NO_RESULT]: 'No parsing result available',
  [ERROR_CODES.CV_PARSING_CANCEL_DENIED]: 'Job cannot be cancelled',
  [ERROR_CODES.JOB_NOT_COMPLETED]: 'Job is not completed yet',
  [ERROR_CODES.INVALID_JOB_DATA]: 'Invalid job data provided',

  [ERROR_CODES.VERSION_NOT_FOUND]: 'Version not found',
  [ERROR_CODES.VERSION_MODIFY_ACTIVE]: 'Cannot modify active version',
  [ERROR_CODES.VERSION_ALREADY_ACTIVE]: 'Version is already active',
  [ERROR_CODES.VERSION_DELETE_ACTIVE]: 'Cannot delete active version',

  [ERROR_CODES.DB_CONNECTION_FAILED]: 'Database connection failed',
  [ERROR_CODES.DB_DUPLICATE_KEY]: 'Duplicate record',

  [ERROR_CODES.AI_SERVICE_ERROR]: 'AI service error',
  [ERROR_CODES.AI_TIMEOUT]: 'AI service timeout',
  [ERROR_CODES.AI_RATE_LIMIT]: 'AI service rate limit exceeded',
  [ERROR_CODES.AI_INVALID_RESPONSE]: 'AI returned invalid response',

  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token expired',
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials',
  [ERROR_CODES.AUTH_ACCOUNT_INACTIVE]: 'Account is not active',
  [ERROR_CODES.AUTH_CURRENT_PASSWORD_INCORRECT]: 'Current password is incorrect',
  [ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]: 'User with this email already exists',
  [ERROR_CODES.AUTH_MISSING_REQUIRED_FIELDS]: 'Email, password, firstName, and lastName are required',
  [ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID]: 'Invalid or expired refresh token',
  [ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED]: 'Invalid or expired refresh token',
  [ERROR_CODES.AUTH_RESET_TOKEN_INVALID]: 'Invalid or expired reset token',
  [ERROR_CODES.AUTH_VERIFICATION_TOKEN_INVALID]: 'Invalid or expired verification token',
  [ERROR_CODES.AUTH_EMAIL_ALREADY_VERIFIED]: 'Email is already verified',

  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.USER_AVATAR_UPLOAD_FAILED]: 'Failed to upload avatar',
  [ERROR_CODES.USER_AVATAR_DELETE_FAILED]: 'Failed to delete avatar',
  [ERROR_CODES.USER_ACCOUNT_DELETE_FAILED]: 'Failed to delete account',
  [ERROR_CODES.USER_FILE_SERVICE_UNAVAILABLE]: 'File service not available for avatar operations',
  [ERROR_CODES.USER_INVALID_FILE_TYPE]: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
  [ERROR_CODES.USER_FILE_TOO_LARGE]: 'File too large. Maximum size exceeded.',
  [ERROR_CODES.USER_INVALID_REFERRAL_CODE]: 'Invalid referral code',
});

/**
 * Vendor-specific error codes
 */
const VENDOR_ERROR_CODES = Object.freeze({
  MONGODB_DUPLICATE_KEY: 11000,
});

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  VENDOR_ERROR_CODES,
};
