const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * NOT FOUND ERROR
 *
 * Error class for resource not found failures.
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND) {
        super(message, HTTP_STATUS.NOT_FOUND, code);
    }
}

module.exports = NotFoundError;
