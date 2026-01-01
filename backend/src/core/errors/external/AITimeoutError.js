const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * AI TIMEOUT ERROR
 *
 * Error class for AI timeouts. Retryable.
 */
class AITimeoutError extends AppError {
    constructor(message = 'AI request timed out', code = ERROR_CODES.AI_TIMEOUT) {
        super(message, HTTP_STATUS.GATEWAY_TIMEOUT, code);
        this.isRetryable = true;
    }
}

module.exports = AITimeoutError;
