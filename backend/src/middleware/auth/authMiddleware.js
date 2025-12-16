/**
 * Authentication middleware
 * Owner: Auth Developer
 */

const AuthService = require('../../services/authService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Access token required'
      }
    });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

module.exports = { authenticateToken };
