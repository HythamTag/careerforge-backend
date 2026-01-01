/**
 * USER ROUTES
 *
 * Route definitions for user management module.
 *
 * @module modules/users/user.routes
 */
const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const { authMiddleware, avatarUploadMiddleware } = require('@middleware');
const {
  validateUpdateProfileMiddleware,
  validateChangePasswordMiddleware,
  validateUpdateSubscriptionMiddleware,
} = require('../validators/user.validator');
const UserController = require('../controllers/user.controller');

const userService = resolve('userService');
const userController = new UserController(userService);

// Profile management
/**
 * @openapi
 * /v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data: { $ref: '#/components/schemas/User' }
 */
router.get('/me', authMiddleware, userController.getProfile.bind(userController));

/**
 * @openapi
 * /v1/users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: 'string' }
 *               lastName: { type: 'string' }
 *               username: { type: 'string' }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/me', authMiddleware, validateUpdateProfileMiddleware, userController.updateProfile.bind(userController));

// Password management
/**
 * @openapi
 * /v1/users/me/password:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Change user password
 */
router.patch('/me/password', authMiddleware, validateChangePasswordMiddleware, userController.changePassword.bind(userController));

// Avatar management
/**
 * @openapi
 * /v1/users/me/avatar:
 *   post:
 *     tags:
 *       - Users
 *     summary: Upload profile avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: 'string', format: 'binary' }
 */
router.post('/me/avatar', authMiddleware, avatarUploadMiddleware.single('avatar'), userController.uploadAvatar.bind(userController));

/**
 * @openapi
 * /v1/users/me/avatar:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete profile avatar
 */
router.delete('/me/avatar', authMiddleware, userController.deleteAvatar.bind(userController));

// Statistics
/**
 * @openapi
 * /v1/users/me/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user-specific statistics
 */
router.get('/me/stats', authMiddleware, userController.getStats.bind(userController));

// Subscription management
/**
 * @openapi
 * /v1/users/me/subscription:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get subscription details
 */
router.get('/me/subscription', authMiddleware, userController.getSubscription.bind(userController));

/**
 * @openapi
 * /v1/users/me/subscription:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update subscription plan
 */
router.patch('/me/subscription', authMiddleware, validateUpdateSubscriptionMiddleware, userController.updateSubscription.bind(userController));

// Account management
/**
 * @openapi
 * /v1/users/me:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Permanently delete account
 */
router.delete('/me', authMiddleware, userController.deleteAccount.bind(userController));

module.exports = router;
