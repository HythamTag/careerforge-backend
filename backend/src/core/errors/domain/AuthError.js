const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * AUTH ERROR
 *
 * Error class for authentication-related failures.
 */
class AuthError extends AppError {
    constructor(message = 'Authentication failed', code = ERROR_CODES.AUTH_INVALID_TOKEN) {
        super(message, HTTP_STATUS.UNAUTHORIZED, code);
    }
}

module.exports = AuthError;
