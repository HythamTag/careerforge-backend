/**
 * CV OPTIMIZER REPOSITORY
 *
 * Data access layer for CV optimizer user preferences and configurations.
 *
 * @module modules/cv-optimizer/repositories/cv-optimizer.repository
 */

const { CvOptimizerModel } = require('../models/cv-optimizer.model');
const { NUMERIC_LIMITS, TIME_CONSTANTS, CV_ATS, OPTIMIZER_CONFIG } = require('@constants');

class CvOptimizerRepository {
  constructor() {
    this.model = CvOptimizerModel;
  }

  /**
     * Get user optimization preferences
     */
  async getUserPreferences(userId) {
    return await this.model.findOne({ userId }).lean();
  }

  /**
     * Update user optimization preferences
     */
  async updateUserPreferences(userId, preferences) {
    return await this.model.findOneAndUpdate(
      { userId },
      {
        ...preferences,
        'usageStats.lastUsedAt': new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  /**
     * Increment usage statistics
     */
  async incrementUsageStats(userId, sections = []) {
    const updateData = {
      $inc: { 'usageStats.totalOptimizations': 1 },
      $set: { 'usageStats.lastUsedAt': new Date() },
    };

    // Update section usage counts
    if (sections.length > 0) {
      sections.forEach(section => {
        updateData.$inc = updateData.$inc || {};
        updateData.$inc[`usageStats.favoriteSections.${section}.count`] = 1;
      });
    }

    return await this.model.findOneAndUpdate(
      { userId },
      updateData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  /**
     * Get popular sections across all users
     */
  async getPopularSections(limit = CV_ATS.DEFAULT_TOP_SUGGESTIONS_LIMIT) {
    return await this.model.aggregate([
      { $unwind: '$usageStats.favoriteSections' },
      {
        $group: {
          _id: '$usageStats.favoriteSections.section',
          totalCount: { $sum: '$usageStats.favoriteSections.count' },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: limit },
    ]);
  }

  /**
     * Clean up old inactive preferences
     */
  async cleanupInactive(daysOld = OPTIMIZER_CONFIG.INACTIVE_CLEANUP_DAYS) {
    const cutoffDate = new Date(Date.now() - (daysOld * TIME_CONSTANTS.MS_PER_DAY));

    return await this.model.deleteMany({
      'usageStats.lastUsedAt': { $lt: cutoffDate },
    });
  }
}

module.exports = CvOptimizerRepository;

