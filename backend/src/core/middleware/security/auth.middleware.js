const jwt = require('jsonwebtoken');
const { AppError } = require('@errors');
const { ERROR_CODES, HTTP_STATUS } = require('@constants');
const config = require('@config');

const authMiddleware = async (req, res, next) => {
  // Check for Bearer token first (user-facing apps)
  const bearerToken = req.header('Authorization')?.replace('Bearer ', '');

  if (bearerToken) {
    try {
      const jwtSecret = config.security.jwt.secret;
      if (!jwtSecret) {
        throw new AppError('Server configuration error: Missing JWT secret', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.UNKNOWN_ERROR);
      }
      const decoded = jwt.verify(bearerToken, jwtSecret);
      req.userId = decoded.id;
      req.authType = 'bearer';
      return next();
    } catch (error) {
      // JWT library errors - check error name for specific handling
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_EXPIRED));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_INVALID_TOKEN));
      }
      return next(new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTH_INVALID_TOKEN));
    }
  }

  // No authentication provided
  return next(new AppError('No authentication provided. Use Bearer token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED));
};

module.exports = authMiddleware;

