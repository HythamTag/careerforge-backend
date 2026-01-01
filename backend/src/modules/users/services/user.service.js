/**
 * USER SERVICE
 *
 * User management operations with comprehensive user lifecycle support.
 *
 * @module modules/users/services/user.service
 */

const { USER_STATUS, USER_ROLE, PAGINATION } = require('@constants');
const { NotFoundError, ValidationError, ForbiddenError, AppError, ErrorFactory } = require('@errors');
const { ERROR_CODES, FILE_LIMITS, SUCCESS_MESSAGES } = require('@constants');
const { pagination } = require('@utils');
const TransactionManager = require('@infrastructure/transaction.manager');

class UserService {
  constructor(userRepository, fileService = null) {
    this.userRepository = userRepository;
    this.fileService = fileService;
  }

  /**
     * Get user profile
     */
  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }
    return user.getProfile();
  }

  /**
     * Get authenticated user (me endpoint)
     */
  async getAuthenticatedUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
      role: user.role,
      subscription: {
        status: user.subscription.status,
        plan: user.subscription.plan,
      },
    };
  }

  /**
     * Update user profile
     */
  async updateProfile(userId, profileData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    const updatedUser = await this.userRepository.updateProfile(userId, profileData);

    return {
      ...updatedUser.getProfile(),
      _links: {
        self: '/v1/users/me',
        avatar: updatedUser.avatar ? '/v1/users/me/avatar' : null,
      },
    };
  }

  /**
     * Change user password
     */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw ErrorFactory.validationFailed('Current password is incorrect', ERROR_CODES.AUTH_CURRENT_PASSWORD_INCORRECT);
    }

    // Update password
    await this.userRepository.changePassword(userId, newPassword);

    return null;
  }

  /**
     * Upload user avatar
     */
  async uploadAvatar(userId, file) {
    if (!this.fileService) {
      throw new AppError('File service not available for avatar upload', ERROR_CODES.USER_FILE_SERVICE_UNAVAILABLE);
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw ErrorFactory.validationFailed('Invalid file type. Only JPEG, PNG, and GIF are allowed.', ERROR_CODES.USER_INVALID_FILE_TYPE);
    }

    if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
      throw ErrorFactory.validationFailed('File too large. Maximum size exceeded.', ERROR_CODES.USER_FILE_TOO_LARGE);
    }

    // Upload file
    const fileName = `avatar-${userId}-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const uploadResult = await this.fileService.uploadFile(file.buffer, fileName, 'avatars');

    // Update user avatar
    const avatarData = {
      url: uploadResult.url,
      fileName: fileName,
      uploadedAt: new Date(),
    };

    await this.userRepository.updateAvatar(userId, avatarData);

    return {
      ...avatarData,
      _links: {
        self: '/v1/users/me/avatar',
      },
    };
  }

  /**
     * Delete user avatar
     */
  async deleteAvatar(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    if (user.avatar && user.avatar.fileName) {
      // Delete file from storage
      await this.fileService.deleteFile(user.avatar.fileName, 'avatars');
    }

    // Remove avatar from user
    await this.userRepository.removeAvatar(userId);

    return {
      message: SUCCESS_MESSAGES.AVATAR_DELETED,
    };
  }

  /**
     * Get user statistics
     */
  async getStats(userId) {
    const stats = await this.userRepository.getUserStats(userId);
    if (!stats) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      data: stats,
      _links: {
        self: '/v1/users/me/stats',
      },
    };
  }

  /**
     * Delete user account (soft delete)
     */
  async deleteAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    // Soft delete the user
    await this.userRepository.softDeleteById(userId);


    return {
      message: SUCCESS_MESSAGES.ACCOUNT_DELETED,
    };
  }

  /**
     * Get user subscription details
     */
  async getSubscription(userId) {
    const subscription = await this.userRepository.getUserSubscription(userId);
    if (!subscription) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      status: subscription.status,
      plan: subscription.plan,
      stripeCustomerId: subscription.stripeCustomerId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: subscription.features,
      _links: {
        self: '/v1/users/me/subscription',
        update: '/v1/users/me/subscription',
      },
    };
  }

  /**
     * Update user subscription
     */
  async updateSubscription(userId, subscriptionData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    // Update subscription data
    const updatedSubscription = await this.userRepository.updateUserSubscription(userId, subscriptionData);

    return {
      status: updatedSubscription.subscription.status,
      plan: updatedSubscription.subscription.plan,
      currentPeriodStart: updatedSubscription.subscription.currentPeriodStart,
      currentPeriodEnd: updatedSubscription.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: updatedSubscription.subscription.cancelAtPeriodEnd,
      features: updatedSubscription.subscription.features,
      _links: {
        self: '/v1/users/me/subscription',
      },
    };
  }

  /**
     * Update user preferences
     */
  async updatePreferences(userId, preferences) {
    await this.userRepository.updatePreferences(userId, preferences);

    return {
      preferences,
      _links: {
        self: '/v1/users/me/preferences',
      },
    };
  }

  /**
     * Get user preferences
     */
  async getPreferences(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      preferences: user.preferences,
      _links: {
        self: '/v1/users/me/preferences',
        update: '/v1/users/me/preferences',
      },
    };
  }

  /**
     * Record user activity
     */
  async recordActivity(userId) {
    await this.userRepository.updateLastActivity(userId);
  }

  /**
     * Check if user has reached usage limit
     */
  async checkUsageLimit(userId, type) {
    const hasReachedLimit = await this.userRepository.hasReachedLimit(userId, type);
    return {
      hasReachedLimit,
      type,
    };
  }

  /**
     * Increment user usage
     */
  async incrementUsage(userId, type, amount = 1) {
    await this.userRepository.incrementUsage(userId, type, amount);

    // Check if user has reached limit after increment
    const limitCheck = await this.checkUsageLimit(userId, type);

    return {
      usageIncremented: true,
      limitReached: limitCheck.hasReachedLimit,
      type,
    };
  }

  /**
     * Get referral information
     */
  async getReferralInfo(userId) {
    const referralInfo = await this.userRepository.getReferralInfo(userId);
    if (!referralInfo) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      data: referralInfo,
      _links: {
        self: '/v1/users/me/referral',
      },
    };
  }

  /**
     * Process referral signup
     */
  async processReferral(referralCode, newUserId) {
    return await TransactionManager.executeAtomic(async (session) => {
      const referrer = await this.userRepository.findByReferralCode(referralCode);
      if (!referrer) {
        throw ErrorFactory.validationFailed('Invalid referral code', ERROR_CODES.USER_INVALID_REFERRAL_CODE);
      }

      // Update referrer's referral count
      await this.userRepository.incrementReferralsCount(referrer._id, { session });

      // Add referral credit to referrer
      await this.userRepository.addReferralCredit(referrer._id, 1, { session });

      // Set referredBy for new user
      await this.userRepository.updateById(newUserId, {
        'referral.referredBy': referrer._id,
      }, { session });

      return {
        referrerId: referrer._id,
        creditsEarned: 1,
      };
    });
  }

  /**
     * Admin: Get all users (paginated)
     */
  async getAllUsers(options = {}) {
    const { users, total } = await Promise.all([
      this.userRepository.findUsers({}, options),
      this.userRepository.countUsers({}),
    ]);

    const userData = users.map(user => ({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: user.role,
      emailVerified: user.emailVerified,
      subscription: {
        status: user.subscription.status,
        plan: user.subscription.plan,
      },
      createdAt: user.createdAt,
      lastActivityAt: user.lastActivityAt,
    }));

    const limit = options.limit ? options.limit : PAGINATION.DEFAULT_LIMIT;
    const skip = options.skip ? options.skip : 0;
    const page = Math.floor(skip / limit) + 1;

    const paginationData = pagination.calculate(page, limit, total);

    return {
      data: userData,
      pagination: paginationData,
    };
  }

  /**
     * Admin: Update user role
     */
  async updateUserRole(userId, newRole, adminUserId) {
    // Verify admin permissions
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== USER_ROLE.ADMIN) {
      throw ErrorFactory.forbidden('Admin access required');
    }

    const updatedUser = await this.userRepository.updateById(userId, { role: newRole });

    if (!updatedUser) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  /**
     * Admin: Suspend user
     */
  async suspendUser(userId, adminUserId, reason) {
    // Verify admin permissions
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== USER_ROLE.ADMIN) {
      throw ErrorFactory.forbidden('Admin access required');
    }

    const updatedUser = await this.userRepository.updateById(userId, {
      status: USER_STATUS.SUSPENDED,
      'security.suspendedAt': new Date(),
      'security.suspendedReason': reason,
    });

    if (!updatedUser) {
      throw ErrorFactory.userNotFound(userId);
    }

    return {
      message: SUCCESS_MESSAGES.USER_SUSPENDED,
    };
  }

  /**
     * Admin: Get system statistics
     */
  async getSystemStats(adminUserId) {
    // Verify admin permissions
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || admin.role !== USER_ROLE.ADMIN) {
      throw ErrorFactory.forbidden('Admin access required');
    }

    const stats = await this.userRepository.getSystemStats();

    return stats;
  }
}

module.exports = UserService;
