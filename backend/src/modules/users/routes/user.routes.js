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
router.get('/me', authMiddleware, userController.getProfile.bind(userController));
router.patch('/me', authMiddleware, validateUpdateProfileMiddleware, userController.updateProfile.bind(userController));

// Password management
router.patch('/me/password', authMiddleware, validateChangePasswordMiddleware, userController.changePassword.bind(userController));

// Avatar management
router.post('/me/avatar', authMiddleware, avatarUploadMiddleware.single('avatar'), userController.uploadAvatar.bind(userController));
router.delete('/me/avatar', authMiddleware, userController.deleteAvatar.bind(userController));

// Statistics
router.get('/me/stats', authMiddleware, userController.getStats.bind(userController));

// Subscription management
router.get('/me/subscription', authMiddleware, userController.getSubscription.bind(userController));
router.patch('/me/subscription', authMiddleware, validateUpdateSubscriptionMiddleware, userController.updateSubscription.bind(userController));

// Account management
router.delete('/me', authMiddleware, userController.deleteAccount.bind(userController));

module.exports = router;
