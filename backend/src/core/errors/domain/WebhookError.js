const AppError = require('../base/AppError');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');

/**
 * WEBHOOK ERROR
 *
 * Error class for webhook-related failures.
 */
class WebhookError extends AppError {
    constructor(message = 'Webhook delivery failed', code = ERROR_CODES.WEBHOOK_DELIVERY_FAILED) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    }
}

module.exports = WebhookError;
