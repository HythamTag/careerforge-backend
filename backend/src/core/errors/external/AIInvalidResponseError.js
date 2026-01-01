const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * AI INVALID RESPONSE ERROR
 *
 * Error class for malformed AI responses.
 */
class AIInvalidResponseError extends AppError {
    constructor(message = 'Invalid AI response format', code = ERROR_CODES.AI_INVALID_RESPONSE) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    }
}

module.exports = AIInvalidResponseError;
