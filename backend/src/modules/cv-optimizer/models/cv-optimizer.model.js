/**
 * CV OPTIMIZER CONFIGURATION MODEL
 *
 * Configuration model for CV optimization settings and preferences.
 * Since CV optimizer is a direct service, this model stores user preferences.
 *
 * @module modules/cv-optimizer/models/cv-optimizer.model
 */

const mongoose = require('mongoose');
const { NUMERIC_LIMITS, OPTIMIZER_CONFIG } = require('@constants');

const cvOptimizerSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Default Optimization Preferences
  defaultOptions: {
    temperature: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
      default: OPTIMIZER_CONFIG.DEFAULT_WEIGHT_SKILLS,
    },
    sections: [{
      type: String,
      enum: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
    }],
    optimizationTypes: [{
      type: String,
      enum: ['ats-compatibility', 'readability', 'impact', 'keyword-optimization'],
    }],
  },

  // Usage Statistics
  usageStats: {
    totalOptimizations: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
      min: NUMERIC_LIMITS.SCORE_MIN,
    },
    lastUsedAt: {
      type: Date,
    },
    favoriteSections: [{
      section: String,
      count: {
        type: Number,
        default: NUMERIC_LIMITS.DEFAULT_COUNT,
      },
    }],
  },
}, {
  timestamps: true,
  collection: 'cv_optimizer_configs',
});

// Indexes
cvOptimizerSchema.index({ userId: 1 }, { unique: true });
cvOptimizerSchema.index({ 'usageStats.lastUsedAt': -1 });

const CvOptimizerModel = mongoose.model('CvOptimizerConfig', cvOptimizerSchema);

module.exports = {
  CvOptimizerModel,
};

