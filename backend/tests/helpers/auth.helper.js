/**
 * AUTHENTICATION TEST HELPERS
 *
 * Helper functions for authentication in tests.
 *
 * @module tests/helpers/auth.helper
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for testing
 * @param {string} userId - User ID to encode in token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  const payload = {
    id: userId.toString(),
    userId: userId.toString(),
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  const secret = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';

  return jwt.sign(payload, secret);
};

/**
 * Generate an expired JWT token for testing
 * @param {string} userId - User ID to encode in token
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (userId) => {
  const payload = {
    userId: userId.toString(),
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000) - (25 * 60 * 60), // 25 hours ago
    exp: Math.floor(Date.now() / 1000) - (60 * 60), // 1 hour ago (expired)
  };

  const secret = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';

  return jwt.sign(payload, secret);
};

/**
 * Generate a JWT token with invalid signature
 * @param {string} userId - User ID to encode in token
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = (userId) => {
  const payload = {
    userId: userId.toString(),
    email: 'test@example.com',
  };

  // Use different secret to make signature invalid
  const secret = 'different-secret-for-invalid-token';

  return jwt.sign(payload, secret);
};

module.exports = {
  generateToken,
  generateExpiredToken,
  generateInvalidToken,
};

