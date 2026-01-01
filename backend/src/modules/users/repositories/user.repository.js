/**
 * USER REPOSITORY
 *
 * Data access layer for user operations with Mongoose.
 *
 * @module modules/users/repositories/user.repository
 */

const { UserModel } = require('../models/user.model');
const { USER_STATUS, USER_ROLE, SUBSCRIPTION_STATUS, PAGINATION, NUMERIC_LIMITS } = require('@constants');

class UserRepository {
  constructor() {
    this.model = UserModel;
  }

  async create(userData, options = {}) {
    const user = new this.model(userData);
    return await user.save({ session: options.session });
  }

  /**
     * Find user by ID
     */
  async findById(id) {
    return await this.model.findById(id);
  }

  /**
     * Find user by ID with password (for authentication)
     */
  async findByIdWithPassword(id) {
    return await this.model.findById(id).select('+password');
  }

  /**
     * Find user by email
     */
  async findByEmail(email) {
    return await this.model.findByEmail(email);
  }

  /**
     * Find user by email with password (for authentication)
     */
  async findByEmailWithPassword(email) {
    return await this.model.findByEmail(email).select('+password +emailVerificationToken +passwordResetToken');
  }

  /**
     * Find active user by email
     */
  async findActiveByEmail(email) {
    return await this.model.findActiveByEmail(email);
  }

  /**
     * Find user by email verification token
     */
  async findByEmailVerificationToken(token) {
    return await this.model.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
  }

  /**
     * Find user by password reset token
     */
  async findByPasswordResetToken(token) {
    return await this.model.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');
  }

  /**
     * Find user by referral code
     */
  async findByReferralCode(refCode) {
    return await this.model.findByReferralCode(refCode);
  }

  /**
     * Update user by ID
     */
  async updateById(id, updateData, options = {}) {
    return await this.model.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true, session: options.session },
    );
  }

  /**
     * Update user by email
     */
  async updateByEmail(email, updateData) {
    return await this.model.findOneAndUpdate(
      { email: email.toLowerCase() },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
  }

  /**
     * Delete user by ID
     */
  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  /**
     * Soft delete user (mark as inactive)
     */
  async softDeleteById(id) {
    return await this.updateById(id, {
      status: USER_STATUS.INACTIVE,
      'subscription.status': SUBSCRIPTION_STATUS.CANCELLED,
    });
  }

  /**
     * Find users with filters
     */
  async findUsers(filters = {}, options = {}) {
    const query = {};

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.subscriptionStatus) {
      query['subscription.status'] = filters.subscriptionStatus;
    }

    if (filters.subscriptionPlan) {
      query['subscription.plan'] = filters.subscriptionPlan;
    }

    if (filters.emailVerified !== undefined) {
      query.emailVerified = filters.emailVerified;
    }

    if (filters.search) {
      query.$or = [
        { email: new RegExp(filters.search, 'i') },
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { displayName: new RegExp(filters.search, 'i') },
      ];
    }

    if (filters.createdAfter) {
      query.createdAt = { ...query.createdAt, $gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      query.createdAt = { ...query.createdAt, $lte: filters.createdBefore };
    }

    // Build query
    let dbQuery = this.model.find(query);

    // Sorting
    if (options.sort) {
      dbQuery = dbQuery.sort(options.sort);
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    // Pagination
    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit);
    }

    if (options.skip) {
      dbQuery = dbQuery.skip(options.skip);
    }

    // Population
    if (options.populate) {
      if (options.populate.includes('referredBy')) {
        dbQuery = dbQuery.populate('referral.referredBy', 'firstName lastName email');
      }
    }

    return await dbQuery.exec();
  }

  /**
     * Count users with filters
     */
  async countUsers(filters = {}) {
    const query = {};

    // Apply same filters as findUsers
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.subscriptionStatus) {
      query['subscription.status'] = filters.subscriptionStatus;
    }

    if (filters.subscriptionPlan) {
      query['subscription.plan'] = filters.subscriptionPlan;
    }

    if (filters.emailVerified !== undefined) {
      query.emailVerified = filters.emailVerified;
    }

    if (filters.search) {
      query.$or = [
        { email: new RegExp(filters.search, 'i') },
        { firstName: new RegExp(filters.search, 'i') },
        { lastName: new RegExp(filters.search, 'i') },
        { displayName: new RegExp(filters.search, 'i') },
      ];
    }

    if (filters.createdAfter) {
      query.createdAt = { ...query.createdAt, $gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      query.createdAt = { ...query.createdAt, $lte: filters.createdBefore };
    }

    return await this.model.countDocuments(query);
  }

  /**
     * Update user's last activity
     */
  async updateLastActivity(userId) {
    return await this.updateById(userId, {
      lastActivityAt: new Date(),
    });
  }

  /**
     * Record login for user
     */
  async recordLogin(userId, ipAddress) {
    const user = await this.findById(userId);
    if (user) {
      user.recordLogin(ipAddress);
      await user.save();
    }
    return user;
  }

  /**
     * Record failed login attempt
     */
  async recordFailedLogin(email) {
    const user = await this.findByEmail(email);
    if (user) {
      user.recordFailedLogin();
      await user.save();
    }
    return user;
  }

  /**
     * Increment usage for user
     */
  async incrementUsage(userId, type, amount = NUMERIC_LIMITS.MIN_VERSION_NUMBER) {
    const user = await this.findById(userId);
    if (user) {
      user.incrementUsage(type, amount);
      await user.save();
    }
    return user;
  }

  /**
     * Reset monthly usage for user
     */
  async resetMonthlyUsage(userId) {
    const user = await this.findById(userId);
    if (user) {
      user.resetMonthlyUsage();
      await user.save();
    }
    return user;
  }

  /**
     * Reset monthly usage for all users
     */
  async resetMonthlyUsageForAll() {
    return await this.model.resetMonthlyUsageForAll();
  }

  /**
     * Check if user has reached usage limit
     */
  async hasReachedLimit(userId, type) {
    const user = await this.findById(userId);
    return user ? user.hasReachedLimit(type) : false;
  }

  /**
     * Get user's subscription details
     */
  async getUserSubscription(userId) {
    const user = await this.findById(userId);
    return user ? user.subscription : null;
  }

  /**
     * Update user's subscription
     */
  async updateUserSubscription(userId, subscriptionData) {
    // Use dot notation to merge subscription fields instead of replacing the entire object
    const updateFields = {};
    for (const [key, value] of Object.entries(subscriptionData)) {
      updateFields[`subscription.${key}`] = value;
    }
    updateFields.updatedAt = new Date();

    return await this.model.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true },
    );
  }

  /**
     * Get user statistics
     */
  async getUserStats(userId) {
    const user = await this.findById(userId);
    return user ? {
      totalGenerations: user.usageStats.totalGenerations,
      totalEnhancements: user.usageStats.totalEnhancements,
      totalAnalyses: user.usageStats.totalAnalyses,
      monthlyGenerations: user.usageStats.monthlyStats.generations,
      monthlyEnhancements: user.usageStats.monthlyStats.enhancements,
      monthlyAnalyses: user.usageStats.monthlyStats.analyses,
      storageUsed: user.usageStats.storageUsed,
      subscriptionPlan: user.subscription.plan,
      subscriptionStatus: user.subscription.status,
      hasPremiumFeatures: user.hasPremiumFeatures,
    } : null;
  }

  /**
     * Get system-wide statistics
     */
  async getSystemStats() {
    const [userStats, subscriptionStats, usageStats] = await Promise.all([
      this.model.countDocuments(),
      this.model.getSubscriptionStats(),
      this.model.getUsageStats(),
    ]);

    return {
      totalUsers: userStats,
      subscriptionStats,
      usageStats: usageStats.length > 0 ? usageStats[0] : {},
    };
  }

  /**
     * Search users
     */
  async searchUsers(searchTerm, options = {}) {
    const filters = {
      search: searchTerm,
      ...options.filters,
    };

    return await this.findUsers(filters, {
      sort: options.sort,
      limit: options.limit,
      skip: options.skip,
      populate: options.populate,
    });
  }

  /**
     * Get users by subscription status
     */
  async getUsersBySubscriptionStatus(status, options = {}) {
    const filters = {
      subscriptionStatus: status,
      ...options.filters,
    };

    const sort = options.sort ? options.sort : { createdAt: -1 };
    const limit = options.limit ? options.limit : PAGINATION.DEFAULT_LIMIT;
    const skip = options.skip ? options.skip : NUMERIC_LIMITS.DEFAULT_COUNT;

    return await this.findUsers(filters, {
      sort,
      limit,
      skip,
    });
  }

  /**
     * Get users by role
     */
  async getUsersByRole(role, options = {}) {
    const filters = {
      role,
      ...options.filters,
    };

    const sort = options.sort ? options.sort : { createdAt: -1 };
    const limit = options.limit ? options.limit : PAGINATION.DEFAULT_LIMIT;
    const skip = options.skip ? options.skip : NUMERIC_LIMITS.DEFAULT_COUNT;

    return await this.findUsers(filters, {
      sort,
      limit,
      skip,
    });
  }

  /**
     * Bulk update users
     */
  async bulkUpdateUsers(userIds, updateData) {
    return await this.model.updateMany(
      { _id: { $in: userIds } },
      { ...updateData, updatedAt: new Date() },
    );
  }

  /**
     * Bulk delete users (soft delete)
     */
  async bulkSoftDeleteUsers(userIds) {
    return await this.bulkUpdateUsers(userIds, {
      status: USER_STATUS.INACTIVE,
      'subscription.status': SUBSCRIPTION_STATUS.CANCELLED,
    });
  }

  /**
     * Verify email for user
     */
  async verifyEmail(token) {
    const user = await this.findByEmailVerificationToken(token);
    if (!user) {
      return null;
    }

    user.emailVerified = true;
    user.status = USER_STATUS.ACTIVE;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    return user;
  }

  /**
     * Reset password for user
     */
  async resetPassword(token, newPassword) {
    const user = await this.findByPasswordResetToken(token);
    if (!user) {
      return null;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    return user;
  }

  /**
     * Update user avatar
     */
  async updateAvatar(userId, avatarData) {
    return await this.updateById(userId, {
      avatar: {
        ...avatarData,
        uploadedAt: new Date(),
      },
    });
  }

  /**
     * Remove user avatar
     */
  async removeAvatar(userId) {
    return await this.updateById(userId, {
      $unset: { avatar: 1 },
    });
  }

  /**
     * Update user preferences
     */
  async updatePreferences(userId, preferences) {
    return await this.updateById(userId, {
      preferences,
      updatedAt: new Date(),
    });
  }

  /**
     * Update user profile
     */
  async updateProfile(userId, profileData) {
    const allowedFields = [
      'firstName', 'lastName', 'displayName', 'phone',
      'timezone', 'socialLinks',
    ];

    const filteredData = {};
    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = profileData[key];
      }
    });

    return await this.updateById(userId, filteredData);
  }

  /**
     * Change user password
     */
  async changePassword(userId, newPassword) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    user.password = newPassword;
    await user.save();
    return user;
  }

  /**
     * Get user's referral information
     */
  async getReferralInfo(userId) {
    const user = await this.findById(userId);
    return user ? {
      referralCode: user.referral.referralCode,
      referralsCount: user.referral.referralsCount,
      referralCredits: user.referral.referralCredits,
      referredBy: user.referral.referredBy,
    } : null;
  }

  /**
     * Add referral credit to user
     */
  async addReferralCredit(userId, amount = NUMERIC_LIMITS.MIN_VERSION_NUMBER, options = {}) {
    const user = await this.model.findById(userId).session(options.session);
    if (user) {
      user.referral.referralCredits += amount;
      await user.save({ session: options.session });
    }
    return user;
  }

  /**
     * Increment referrals count for referrer
     */
  async incrementReferralsCount(referrerId, options = {}) {
    const referrer = await this.model.findById(referrerId).session(options.session);
    if (referrer) {
      referrer.referral.referralsCount += NUMERIC_LIMITS.MIN_VERSION_NUMBER;
      await referrer.save({ session: options.session });
    }
    return referrer;
  }
}

module.exports = UserRepository;
