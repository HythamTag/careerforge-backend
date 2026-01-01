/**
 * @typedef {Object} ErrorMetadata
 * @property {Array<{field: string, message: string}>} [validationErrors] - Validation errors
 * @property {string} [provider] - AI provider name
 * @property {number} [attemptNumber] - Retry attempt number
 * @property {Object} [details] - Additional error details
 */

/**
 * @typedef {Object} ErrorContext
 * @property {string} [userId] - User ID
 * @property {string} [requestId] - Request ID
 * @property {string} [resourceId] - Resource ID
 * @property {string} [traceId] - Trace ID
 */

/**
 * @typedef {Object} ErrorJSON
 * @property {boolean} success - Always false
 * @property {Object} error - Error details
 * @property {string} error.message - Error message
 * @property {string} error.code - Error code
 * @property {number} error.statusCode - HTTP status code
 * @property {string} error.timestamp - ISO timestamp
 * @property {ErrorContext} [error.context] - Error context
 * @property {ErrorMetadata} [error.metadata] - Error metadata
 * @property {boolean} [error.retryable] - Whether retryable
 * @property {number} [error.retryAfter] - Retry delay in ms
 */

module.exports = {};
