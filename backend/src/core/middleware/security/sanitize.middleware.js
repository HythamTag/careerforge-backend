/**
 * ENHANCED INPUT SANITIZATION MIDDLEWARE
 *
 * Provides comprehensive input sanitization and security measures:
 * - XSS prevention
 * - SQL injection prevention
 * - Command injection prevention
 * - Path traversal prevention
 * - Null byte attack prevention
 */

const { STRING_LIMITS } = require('@constants');

const sanitizeInput = (req, res, next) => {
  // Dangerous patterns to remove
  const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript URLs
    /vbscript:/gi, // VBScript URLs
    /on\w+\s*=/gi, // Event handlers
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframes
    /\0/g, // Null bytes
    /\.\./g, // Path traversal
    /['"`;]/g, // Dangerous quotes and semicolons
  ];

  const sanitizeString = (str) => {
    if (typeof str !== 'string') {return str;}

    let sanitized = str.trim();

    // Remove dangerous patterns
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Limit string length to prevent DoS
    const maxLength = STRING_LIMITS.JOB_DESCRIPTION_MAX_LENGTH;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {return obj;}

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip private properties and dangerous keys
      if (key.startsWith('_') || key.startsWith('$')) {continue;}

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  // Sanitize all input sources
  if (req.query) {req.query = sanitizeObject(req.query);}
  if (req.body) {req.body = sanitizeObject(req.body);}
  if (req.params) {req.params = sanitizeObject(req.params);}

  next();
};

module.exports = sanitizeInput;

