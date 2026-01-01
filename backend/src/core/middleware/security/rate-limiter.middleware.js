const rateLimit = require('express-rate-limit');
const { ERROR_CODES } = require('@constants');
const config = require('@config');

const rateLimiterMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.uploads,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many upload requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = rateLimiterMiddleware;

