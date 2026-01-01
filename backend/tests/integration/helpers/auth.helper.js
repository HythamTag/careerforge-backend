const jwt = require('jsonwebtoken');

/**
 * Generate a valid JWT token for testing
 * @param {string} userId - User ID to include in token
 * @returns {string} Signed JWT token
 */
exports.generateToken = (userId) => {
    console.log('[AuthHelper] Generating token for:', userId);
    return jwt.sign(
        { id: userId, userId: userId, role: 'user', email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
        { expiresIn: '1h' }
    );
};
