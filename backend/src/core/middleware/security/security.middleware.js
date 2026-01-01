/**
 * SECURITY HEADERS MIDDLEWARE
 *
 * Adds comprehensive security headers to all responses:
 * - Content Security Policy (CSP)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

// const { SECURITY } = require("@constants"); // Removed
const config = require('@config');

const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      'default-src \'self\'',
      'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'', // Allow React inline scripts
      'style-src \'self\' \'unsafe-inline\'', // Allow inline styles
      'img-src \'self\' data: https:', // Allow data URLs and HTTPS images
      'font-src \'self\'',
      'connect-src \'self\'', // Allow API calls
      'frame-ancestors *', // Allow framing (needed for CV Preview iframe)
      'base-uri \'self\'',
      'form-action \'self\'',
    ].join('; '),
  );

  // HTTP Strict Transport Security (only in production)
  if (config.server.isProduction) {
    res.setHeader('Strict-Transport-Security', config.security.headers.strictTransportSecurity);
  }

  // Prevent clickjacking - Allow framing for preview
  res.removeHeader('X-Frame-Options');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
      'speaker=()',
      'fullscreen=(self)',
      'interest-cohort=()',
    ].join(', '),
  );

  // Remove server information
  res.removeHeader('X-Powered-By');

  // Cache control for sensitive endpoints
  if (req.path.includes('/v1/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

module.exports = securityHeaders;

