class AppError extends Error {
  constructor(message, statusCode, code, isOperational) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
