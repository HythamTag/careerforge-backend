const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * VALIDATION ERROR
 *
 * Error class for validation failures.
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed', code = ERROR_CODES.VALIDATION_ERROR, validationErrors = []) {
        super(message, HTTP_STATUS.BAD_REQUEST, code, { validationErrors });
    }
}

module.exports = ValidationError;
