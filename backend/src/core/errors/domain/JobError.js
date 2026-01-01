const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * JOB ERROR
 *
 * Error class for job queue failures.
 */
class JobError extends AppError {
    constructor(message = 'Job operation failed', code = ERROR_CODES.JOB_QUEUE_ERROR) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    }
}

module.exports = JobError;
