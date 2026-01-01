const { ERROR_CODES } = require('@constants');
const NotFoundError = require('../domain/NotFoundError');
const ValidationError = require('../domain/ValidationError');
const AuthError = require('../domain/AuthError');
const AITimeoutError = require('../external/AITimeoutError');

/**
 * ERROR FACTORY
 *
 * Factory methods for creating common errors with context.
 */
class ErrorFactory {
    static cvNotFound(cvId) {
        return new NotFoundError('CV not found', ERROR_CODES.CV_NOT_FOUND)
            .withContext('cvId', cvId);
    }

    static notFound(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND) {
        return new NotFoundError(message, code);
    }

    static userNotFound(userId) {
        return new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND)
            .withContext('userId', userId);
    }

    static versionNotFound(versionId) {
        return new NotFoundError('Version not found', ERROR_CODES.VERSION_NOT_FOUND)
            .withContext('versionId', versionId);
    }

    static webhookNotFound(webhookId) {
        return new NotFoundError('Webhook not found', ERROR_CODES.WEBHOOK_NOT_FOUND)
            .withContext('webhookId', webhookId);
    }

    static deliveryNotFound(deliveryId) {
        return new NotFoundError('Webhook delivery not found', ERROR_CODES.WEBHOOK_DELIVERY_NOT_FOUND)
            .withContext('deliveryId', deliveryId);
    }

    static parsingJobNotFound(jobId) {
        return new NotFoundError('Parsing job not found', ERROR_CODES.PARSING_JOB_NOT_FOUND)
            .withContext('jobId', jobId);
    }

    static generationJobNotFound(jobId) {
        return new NotFoundError('Generation job not found', ERROR_CODES.GENERATION_JOB_NOT_FOUND)
            .withContext('jobId', jobId);
    }

    static atsJobNotFound(jobId) {
        return new NotFoundError('ATS analysis job not found', ERROR_CODES.ATS_JOB_NOT_FOUND)
            .withContext('jobId', jobId);
    }

    static templateNotFound(templateId) {
        return new NotFoundError('Template not found', ERROR_CODES.TEMPLATE_NOT_FOUND)
            .withContext('templateId', templateId);
    }

    static invalidToken(reason) {
        return new AuthError('Invalid token', ERROR_CODES.AUTH_INVALID_TOKEN)
            .withContext('reason', reason);
    }

    static aiTimeout(provider, duration) {
        return new AITimeoutError(
            `AI request timed out after ${duration}ms`,
            ERROR_CODES.AI_TIMEOUT
        ).withContext('provider', provider)
            .withContext('duration', duration);
    }

    static validationFailed(message, code = ERROR_CODES.VALIDATION_ERROR, errors = null) {
        return new ValidationError(
            message || 'Validation failed',
            code,
            errors
        );
    }

    static forbidden(message = 'Access denied', reason = null) {
        const ForbiddenError = require('../http/ForbiddenError');
        const error = new ForbiddenError(message, ERROR_CODES.FORBIDDEN);
        if (reason) error.withContext('reason', reason);
        return error;
    }

    static unauthorized(message = 'Authentication required') {
        const AuthError = require('../domain/AuthError');
        return new AuthError(message, ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    static resourceNotFound(resourceName, id) {
        return new NotFoundError(`${resourceName} not found`, ERROR_CODES.NOT_FOUND)
            .withContext('resource', resourceName)
            .withContext('id', id);
    }
    static databaseError(message, originalError = null) {
        const AppError = require('../base/AppError');
        const error = new AppError(message || 'Database error', 500, ERROR_CODES.DATABASE_ERROR);
        if (originalError) {
            error.withContext('originalError', originalError.message);
        }
        return error;
    }

    static internalError(message, originalError = null) {
        const AppError = require('../base/AppError');
        const error = new AppError(message || 'Internal server error', 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
        if (originalError) {
            error.withContext('originalError', originalError.message);
        }
        return error;
    }
}

module.exports = ErrorFactory;
