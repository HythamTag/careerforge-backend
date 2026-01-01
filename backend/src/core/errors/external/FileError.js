const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * FILE ERROR
 *
 * Error class for file processing.
 */
class FileError extends AppError {
    constructor(message = 'File processing failed', code = ERROR_CODES.FILE_UPLOAD_FAILED) {
        super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, code);
    }
}

module.exports = FileError;
