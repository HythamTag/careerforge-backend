const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * CV ERROR
 *
 * Error class for CV-related failures.
 */
class CVError extends AppError {
    constructor(message = 'CV operation failed', code = ERROR_CODES.CV_NOT_FOUND) {
        super(message, HTTP_STATUS.NOT_FOUND, code);
    }
}

module.exports = CVError;
