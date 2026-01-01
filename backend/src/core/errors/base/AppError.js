/**
 * BASE APPLICATION ERROR
 *
 * Enhanced base error class with metadata, context tracking, and serialization.
 * 
 * @extends Error
 * @property {number} statusCode - HTTP status code
 * @property {string} code - Application-specific error code
 * @property {boolean} isOperational - Whether error is operational (expected)
 * @property {boolean} isRetryable - Whether operation can be retried
 * @property {Object} metadata - Domain-specific metadata
 * @property {Object} context - Execution context (userId, requestId, etc.)
 * @property {string} timestamp - ISO timestamp when error occurred
 */
class AppError extends Error {
    /**
     * Create an application error
     * @param {string} message - Human-readable error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Application error code
     * @param {Object} [metadata={}] - Domain-specific metadata
     */
    constructor(message, statusCode, code, metadata = {}) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.isRetryable = false;
        this.metadata = metadata;
        this.context = {};
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Add context to error (fluent API)
     * @param {string} key - Context key
     * @param {any} value - Context value
     * @returns {AppError} this for chaining
     */
    withContext(key, value) {
        this.context[key] = value;
        return this;
    }

    /**
     * Add user ID to context
     * @param {string} userId - User identifier
     * @returns {AppError} this for chaining
     */
    withUserId(userId) {
        return this.withContext('userId', userId);
    }

    /**
     * Add request/correlation ID to context
     * @param {string} requestId - Request identifier
     * @returns {AppError} this for chaining
     */
    withRequestId(requestId) {
        return this.withContext('requestId', requestId);
    }

    /**
     * Add resource ID to context
     * @param {string} resourceId - Resource identifier
     * @returns {AppError} this for chaining
     */
    withResourceId(resourceId) {
        return this.withContext('resourceId', resourceId);
    }

    /**
     * Mark error as retryable
     * @param {number} [retryAfter] - Suggested retry delay in ms
     * @returns {AppError} this for chaining
     */
    asRetryable(retryAfter) {
        this.isRetryable = true;
        if (retryAfter) {
            this.retryAfter = retryAfter;
        }
        return this;
    }

    /**
     * Serialize error to JSON (for API responses)
     * @returns {Object} JSON representation
     */
    toJSON() {
        const json = {
            success: false,
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                timestamp: this.timestamp,
            },
        };

        // Include context if present
        if (Object.keys(this.context).length > 0) {
            json.error.context = this.context;
        }

        // Include metadata if present
        if (Object.keys(this.metadata).length > 0) {
            json.error.metadata = this.metadata;
        }

        // Include retry info if retryable
        if (this.isRetryable) {
            json.error.retryable = true;
            if (this.retryAfter) {
                json.error.retryAfter = this.retryAfter;
            }
        }

        return json;
    }

    /**
     * String representation for logging
     * @returns {string} formatted error string
     */
    toString() {
        return `[${this.code}] ${this.message}`;
    }

    /**
     * Get log-safe representation (excludes sensitive data)
     * @returns {Object} sanitized error for logging
     */
    toLog() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            isOperational: this.isOperational,
            isRetryable: this.isRetryable,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack,
        };
    }
}

module.exports = AppError;
