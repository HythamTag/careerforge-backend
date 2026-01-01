const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * AI QUOTA EXCEEDED ERROR
 *
 * Error class for rate limits/quota. Retryable with delay.
 */
class AIQuotaExceededError extends AppError {
    constructor(message = 'AI quota exceeded', code = ERROR_CODES.AI_RATE_LIMIT) {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS, code);
        this.isRetryable = true;
        this.retryAfter = 60000;
    }
}

module.exports = AIQuotaExceededError;
