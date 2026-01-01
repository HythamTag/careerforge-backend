const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * FORBIDDEN ERROR
 *
 * Error class for access denied failures.
 */
class ForbiddenError extends AppError {
    constructor(message = 'Access denied', code = ERROR_CODES.FORBIDDEN) {
        super(message, HTTP_STATUS.FORBIDDEN, code);
    }
}

module.exports = ForbiddenError;
