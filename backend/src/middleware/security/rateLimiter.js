const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
});

module.exports = { apiLimiter };
