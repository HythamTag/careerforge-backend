const AppError = require('../../errors/AppError');
const ERROR_CODES = require('../../errors/errorCodes');

function errorHandler(err, req, res, next) {
  let error = err;

  if (!(err instanceof AppError)) {
    error = new AppError(
      err.message || 'Internal server error',
      err.statusCode || 500,
      err.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      false
    );
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: {
      code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error'
    }
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
