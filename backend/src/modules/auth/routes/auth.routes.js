/**
 * AUTH ROUTES
 *
 * Route definitions for authentication module.
 *
 * @module modules/auth/auth.routes
 */
const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const { authMiddleware } = require('@middleware');
const {
  validateRegisterMiddleware,
  validateLoginMiddleware,
  validateRefreshTokenMiddleware,
  validateForgotPasswordMiddleware,
  validateResetPasswordMiddleware,
  validateVerifyEmailParamsMiddleware,
} = require('../validators/auth.validator');
const AuthController = require('../controllers/auth.controller');

// Initialize controller with service from container
const authService = resolve('authService');
const authController = new AuthController(authService);

// Authentication routes with validation
router.post('/register', validateRegisterMiddleware, authController.register.bind(authController));
router.post('/login', validateLoginMiddleware, authController.login.bind(authController));
router.post('/refresh', validateRefreshTokenMiddleware, authController.refresh.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.post('/forgot-password', validateForgotPasswordMiddleware, authController.forgotPassword.bind(authController));
router.post('/reset-password', validateResetPasswordMiddleware, authController.resetPassword.bind(authController));
router.get('/verify-email/:token', validateVerifyEmailParamsMiddleware, authController.verifyEmail.bind(authController));
router.post('/resend-verification', authMiddleware, authController.resendVerification.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));

module.exports = router;
