const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * STORAGE ERROR
 *
 * Error class for storage operations.
 */
class StorageError extends AppError {
    constructor(message = 'Storage operation failed', code = ERROR_CODES.STORAGE_SERVICE_ERROR) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    }
}

module.exports = StorageError;
