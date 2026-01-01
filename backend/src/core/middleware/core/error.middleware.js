// ==========================================
// CORE MODULES
// ==========================================
const logger = require('@utils/logger');
const config = require('@config');
const { ERROR_CODES, DATABASE, HTTP_STATUS } = require('@constants');
const { AppError } = require('@errors');

const errorMiddleware = (err, req, res, next) => {
  let error = err;
  const correlationId = req.correlationId ? req.correlationId : res.locals.correlationId;

  logger.logError(err, {
    operation: 'Error handling',
    correlationId,
    path: req.path,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // If error is already an AppError instance, use it directly
  if (err.isOperational) {
    error = err;
  } else if (err.name === 'CastError') {
    error = new AppError('Resource not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  } else if (err.code === DATABASE?.MONGODB_DUPLICATE_KEY_ERROR || err.code === 11000) {
    error = new AppError('Duplicate field value entered', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.DB_DUPLICATE_KEY);
  } else if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_INVALID_TOKEN);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_EXPIRED);
  } else {
    // Unknown error - wrap it
    error = new AppError(err.message, err.statusCode ? err.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.UNKNOWN_ERROR);
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: error.code ? error.code : ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
    },
  };

  // Include validation errors if available (from ValidationError)
  if (err.validationErrors && Array.isArray(err.validationErrors)) {
    errorResponse.error.validationErrors = err.validationErrors;
  }

  // Include stack trace in development
  if (config.server.isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(error.statusCode ? error.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
};

module.exports = errorMiddleware;

