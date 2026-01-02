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
/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account and receive authentication tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               refCode:
 *                 type: string
 *                 description: Optional referral code
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/register', validateRegisterMiddleware, authController.register.bind(authController));

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user and receive access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLoginMiddleware, authController.login.bind(authController));

/**
 * @openapi
 * /v1/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/refresh', validateRefreshTokenMiddleware, authController.refresh.bind(authController));

/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Invalidate the user's refresh token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authMiddleware, authController.logout.bind(authController));
/**
 * @openapi
 * /v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 */
router.post('/forgot-password', validateForgotPasswordMiddleware, authController.forgotPassword.bind(authController));
/**
 * @openapi
 * /v1/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Set a new password using a valid reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', validateResetPasswordMiddleware, authController.resetPassword.bind(authController));
/**
 * @openapi
 * /v1/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify email address
 *     description: Verify user's email using the token sent via email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get('/verify-email/:token', validateVerifyEmailParamsMiddleware, authController.verifyEmail.bind(authController));
/**
 * @openapi
 * /v1/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend verification email
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post('/resend-verification', authMiddleware, authController.resendVerification.bind(authController));

/**
 * @openapi
 * /v1/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Returns the profile of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, authController.getMe.bind(authController));

module.exports = router;
