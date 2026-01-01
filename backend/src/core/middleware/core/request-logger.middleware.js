const logger = require('@utils/logger');
const config = require('@config');

/**
 * Request Logger Middleware
 * Logs requests with correlation ID and performance metrics
 * Filters health check endpoints to reduce noise
 */
const requestLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const correlationId = req.correlationId || 'unknown';

  // Filter health check endpoints - use DEBUG level
  const isHealthCheck = req.path === '/health';

  // Log request start
  if (isHealthCheck) {
    logger.debug('Request received', {
      operation: 'Request logging',
      correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } else {
    logger.info('Request received', {
      operation: 'Request logging',
      correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  // Capture response finish to log duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      operation: 'Request logging',
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      ip: req.ip,
    };

    // Log with performance metrics
    if (duration > config.performance.verySlowRequestMs) {
      logger.warn('Very slow request', logData);
    } else if (duration > config.performance.slowRequestMs) {
      logger.info('Slow request', logData);
    } else if (!isHealthCheck) {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = requestLoggerMiddleware;

