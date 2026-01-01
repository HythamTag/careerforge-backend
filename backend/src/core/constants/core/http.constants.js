/**
 * ============================================================================
 * http.constants.js - HTTP Status Codes & Messages (Pure Static)
 * ============================================================================
 */

/**
 * @typedef {200|201|202|204|400|401|403|404|409|422|429|500|503} HttpStatusCode
 */

const HTTP_STATUS = Object.freeze({
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
});

/**
 * Standard HTTP response messages
 */
const HTTP_MESSAGES = Object.freeze({
  [HTTP_STATUS.OK]: 'OK',
  [HTTP_STATUS.CREATED]: 'Resource created successfully',
  [HTTP_STATUS.NO_CONTENT]: 'No content',
  [HTTP_STATUS.BAD_REQUEST]: 'Bad request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
  [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Resource not found',
  [HTTP_STATUS.CONFLICT]: 'Resource conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable entity',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service unavailable',
});

/**
 * HTTP Status Code Ranges
 */
const HTTP_STATUS_RANGES = Object.freeze({
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 299,
  isSuccess: (statusCode) => statusCode >= 200 && statusCode <= 299,
});

/**
 * Success Messages
 * Standard success messages for user-facing responses
 */
const SUCCESS_MESSAGES = Object.freeze({
  PASSWORD_CHANGED: 'Password changed successfully',
  AVATAR_UPLOADED: 'Avatar uploaded successfully',
  AVATAR_DELETED: 'Avatar deleted successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
  USER_PROFILE_UPDATED: 'User profile updated successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
  USER_SUSPENDED: 'User suspended successfully',
});

/**
 * Response Messages
 * Standard API response messages
 */
const RESPONSE_MESSAGES = Object.freeze({
  CV_PARSING_STARTED: 'CV parsing job started successfully',
  CV_GENERATION_STARTED: 'CV generation job started successfully',
  CV_OPTIMIZATION_COMPLETED: 'CV optimization completed successfully',
  JOB_CANCELLED: 'Job cancelled successfully',
  JOB_NOT_FOUND: 'Job not found',
  CV_NOT_FOUND: 'CV not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  VALIDATION_FAILED: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
});

module.exports = {
  HTTP_STATUS,
  HTTP_MESSAGES,
  HTTP_STATUS_RANGES,
  SUCCESS_MESSAGES,
  RESPONSE_MESSAGES,
};
