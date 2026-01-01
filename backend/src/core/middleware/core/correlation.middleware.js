const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID Middleware
 * Adds a unique correlation ID to each request for tracing across services
 */
const correlationMiddleware = (req, res, next) => {
  // Use existing correlation ID from header or generate new one
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Set correlation ID in response header
  res.setHeader('X-Correlation-ID', req.correlationId);
  
  // Add to response locals for use in error handlers
  res.locals.correlationId = req.correlationId;
  
  next();
};

module.exports = correlationMiddleware;

