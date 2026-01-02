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
 *     operationId: getUserProfile
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
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/me', authMiddleware, userController.getProfile.bind(userController));

/**
 * @openapi
 * /v1/users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     operationId: updateUserProfile
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: changeUserPassword
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid password format or incorrect current password
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: uploadUserAvatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: 'string', format: 'binary' }
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: string, description: "Avatar URL" }
 *       400:
 *         description: Invalid file
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large
 *         $ref: '#/components/schemas/Error'
 */
router.post('/me/avatar', authMiddleware, avatarUploadMiddleware.single('avatar'), userController.uploadAvatar.bind(userController));

/**
 * @openapi
 * /v1/users/me/avatar:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete profile avatar
 *     operationId: deleteUserAvatar
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: getUserStatistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: getUserSubscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/me/subscription', authMiddleware, userController.getSubscription.bind(userController));

/**
 * @openapi
 * /v1/users/me/subscription:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update subscription plan
 *     operationId: updateUserSubscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan: { type: string, enum: ['free', 'pro', 'premium'] }
 *     responses:
 *       200:
 *         description: Subscription updated
 *       400:
 *         description: Invalid plan
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 *       402:
 *         description: Payment required for plan upgrade
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: deleteUserAccount
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/me', authMiddleware, userController.deleteAccount.bind(userController));

module.exports = router;
