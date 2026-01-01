const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * AI ERROR
 *
 * Base error class for AI functionality.
 */
class AIError extends AppError {
    constructor(message = 'AI operation failed', code = ERROR_CODES.AI_SERVICE_ERROR) {
        super(message, HTTP_STATUS.BAD_GATEWAY, code);
    }
}

module.exports = AIError;
