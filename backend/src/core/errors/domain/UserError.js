const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * USER ERROR
 *
 * Error class for user-related failures.
 */
class UserError extends AppError {
    constructor(message = 'User operation failed', code = ERROR_CODES.USER_NOT_FOUND) {
        super(message, HTTP_STATUS.NOT_FOUND, code);
    }
}

module.exports = UserError;
