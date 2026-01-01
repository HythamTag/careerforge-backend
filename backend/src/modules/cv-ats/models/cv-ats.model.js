/**
 * CV ATS ANALYSIS MODEL
 *
 * Database schema and model for CV ATS analysis job tracking.
 * Handles analysis requests, scoring, suggestions, and job lifecycle.
 *
 * @module modules/cv-ats/models/cv-ats.model
 */

const mongoose = require('mongoose');
const { ATS_STATUS, ATS_TYPE, ATS_PRIORITY, NUMERIC_LIMITS, JOB_LIMITS, STRING_LIMITS, ERROR_MESSAGES, ERROR_CODES } = require('@constants');

const cvAtsSchema = new mongoose.Schema({
  // Job Reference
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },

  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // CV References
  cvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV',
    required: true,
  },
  versionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
  },

  // Analysis Configuration
  type: {
    type: String,
    enum: Object.values(ATS_TYPE),
    required: true,
    default: ATS_TYPE.COMPREHENSIVE,
  },
  priority: {
    type: String,
    enum: Object.values(ATS_PRIORITY),
    required: true,
    default: ATS_PRIORITY.MEDIUM,
  },

  // Target Job Information
  targetJob: {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: STRING_LIMITS.JOB_TITLE_MAX_LENGTH,
    },
    company: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.COMPANY_NAME_MAX_LENGTH,
    },
    description: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.JOB_DESCRIPTION_MAX_LENGTH,
    },
    requirements: [{
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    }],
    location: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.LOCATION_MAX_LENGTH,
    },
    salary: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.GPA_MAX_LENGTH,
    },
  },

  // Analysis Parameters
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // CV Content (snapshot)
  cvContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Status & Progress
  status: {
    type: String,
    enum: Object.values(ATS_STATUS),
    required: true,
    default: ATS_STATUS.PENDING,
  },
  progress: {
    type: Number,
    min: NUMERIC_LIMITS.PROGRESS_MIN,
    max: NUMERIC_LIMITS.PROGRESS_MAX,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  currentStep: {
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.TITLE_MAX_LENGTH,
  },
  totalSteps: {
    type: Number,
    min: NUMERIC_LIMITS.MIN_VERSION_NUMBER,
    default: NUMERIC_LIMITS.MIN_VERSION_NUMBER,
  },

  // Timing
  queuedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  failedAt: {
    type: Date,
  },
  processingTimeMs: {
    type: Number,
  },

  // AI Information
  aiProvider: {
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.CATEGORY_MAX_LENGTH,
  },
  aiModel: {
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.TITLE_MAX_LENGTH,
  },

  // Cost & Usage Tracking
  tokensUsed: {
    type: Number,
    min: NUMERIC_LIMITS.SCORE_MIN,
  },
  cost: {
    type: mongoose.Schema.Types.Decimal128,
    min: NUMERIC_LIMITS.SCORE_MIN,
  },

  // Results
  results: {
    // Overall scoring
    overallScore: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },

    // Detailed scoring
    keywordMatch: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    experienceMatch: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    skillsMatch: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    formattingScore: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },

    // Detailed breakdown for frontend visualization
    breakdown: {
      structure: { type: Number, min: 0, max: 40 },
      skills: { type: Number, min: 0, max: 25 },
      experience: { type: Number, min: 0, max: 25 },
      formatting: { type: Number, min: 0, max: 10 },
    },

    // Analysis details
    strengths: [{
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    }],
    weaknesses: [{
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    }],
    recommendations: [{
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    }],
    missingKeywords: [{
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.SKILL_MAX_LENGTH,
    }],

    // Keyword analysis
    keywordAnalysis: {
      found: [{
        keyword: String,
        count: Number,
        context: [String],
      }],
      missing: [{
        keyword: String,
        importance: {
          type: String,
          enum: ['high', 'medium', 'low'],
        },
      }],
    },

    // Format analysis
    formatIssues: [{
      type: String,
      severity: {
        type: String,
        enum: ['critical', 'warning', 'info'],
      },
      suggestion: String,
    }],

    // Job compatibility
    jobCompatibility: {
      score: {
        type: Number,
        min: NUMERIC_LIMITS.SCORE_MIN,
        max: NUMERIC_LIMITS.SCORE_MAX,
      },
      matchingSkills: [{
        type: String,
        trim: true,
      }],
      missingRequirements: [{
        type: String,
        trim: true,
      }],
    },
  },

  // Error handling
  error: {
    message: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
    },
    code: {
      type: String,
      trim: true,
      maxlength: STRING_LIMITS.CATEGORY_MAX_LENGTH,
    },
    details: mongoose.Schema.Types.Mixed,
  },

  // Retry logic
  retryCount: {
    type: Number,
    min: NUMERIC_LIMITS.SCORE_MIN,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
    max: JOB_LIMITS.MAX_RETRIES,
  },
  maxRetries: {
    type: Number,
    min: JOB_LIMITS.MIN_RETRIES,
    default: JOB_LIMITS.DEFAULT_RETRIES,
    max: JOB_LIMITS.MAX_RETRIES,
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

}, {
  timestamps: true,
  collection: 'cv_ats_analyses',
});

// Indexes for performance
cvAtsSchema.index({ userId: 1, createdAt: -1 });
cvAtsSchema.index({ jobId: 1 }, { unique: true });
cvAtsSchema.index({ cvId: 1, createdAt: -1 });
cvAtsSchema.index({ status: 1, createdAt: -1 });
cvAtsSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Virtual for job reference
cvAtsSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for CV reference
cvAtsSchema.virtual('cv', {
  ref: 'CV',
  localField: 'cvId',
  foreignField: '_id',
  justOne: true,
});

// Instance methods
cvAtsSchema.methods.isCompleted = function () {
  return this.status === ATS_STATUS.COMPLETED;
};

cvAtsSchema.methods.isFailed = function () {
  return this.status === ATS_STATUS.FAILED;
};

cvAtsSchema.methods.canRetry = function () {
  return this.retryCount < this.maxRetries;
};

cvAtsSchema.methods.markAsStarted = function () {
  this.status = ATS_STATUS.PROCESSING;
  this.startedAt = new Date();
  return this.save();
};

cvAtsSchema.methods.markAsCompleted = function (results) {
  this.status = ATS_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.results = results;
  if (this.startedAt) {
    this.processingTimeMs = this.completedAt - this.startedAt;
  }
  return this.save();
};

cvAtsSchema.methods.markAsFailed = function (error) {
  this.status = ATS_STATUS.FAILED;
  this.failedAt = new Date();
  this.error = {
    message: error.message ? error.message : ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    code: error.code ? error.code : ERROR_CODES.UNKNOWN_ERROR,
    details: error.details ? error.details : {},
  };
  return this.save();
};

cvAtsSchema.methods.incrementRetry = function () {
  this.retryCount += 1;
  return this.save();
};

// Static methods
cvAtsSchema.statics.findByJobId = function (jobId) {
  return this.findOne({ jobId }).populate('job');
};

cvAtsSchema.statics.findByUserId = function (userId, options = {}) {
  const query = this.find({ userId });

  if (options.status) { query.where('status').equals(options.status); }
  if (options.type) { query.where('type').equals(options.type); }
  if (options.cvId) { query.where('cvId').equals(options.cvId); }

  if (options.sort) { query.sort(options.sort); }
  if (options.limit) { query.limit(options.limit); }
  if (options.skip) { query.skip(options.skip); }

  if (options.populate) {
    options.populate.forEach(populateField => {
      query.populate(populateField);
    });
  }

  return query;
};

cvAtsSchema.statics.countByUserId = function (userId, filters = {}) {
  const query = this.countDocuments({ userId });

  if (filters.status) { query.where('status').equals(filters.status); }
  if (filters.type) { query.where('type').equals(filters.type); }
  if (filters.cvId) { query.where('cvId').equals(filters.cvId); }

  return query;
};

cvAtsSchema.statics.getUserStats = function (userId) {
  return this.aggregate([
    { $match: { userId: this.convertToObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        completedAnalyses: {
          $sum: { $cond: [{ $eq: ['$status', ATS_STATUS.COMPLETED] }, 1, 0] },
        },
        failedAnalyses: {
          $sum: { $cond: [{ $eq: ['$status', ATS_STATUS.FAILED] }, 1, 0] },
        },
        averageScore: { $avg: '$results.overallScore' },
        totalProcessingTime: { $sum: '$processingTimeMs' },
        totalCost: { $sum: { $toDouble: '$cost' } },
      },
    },
  ]);
};

cvAtsSchema.statics.getScoreDistribution = function (userId) {
  return this.aggregate([
    { $match: { userId: this.convertToObjectId(userId), status: ATS_STATUS.COMPLETED } },
    {
      $bucket: {
        groupBy: '$results.overallScore',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          average: { $avg: '$results.overallScore' },
        },
      },
    },
  ]);
};

cvAtsSchema.statics.getTopSuggestions = function (userId, limit = NUMERIC_LIMITS.DEFAULT_LIMIT) {
  return this.aggregate([
    { $match: { userId: this.convertToObjectId(userId), status: ATS_STATUS.COMPLETED } },
    { $unwind: '$results.recommendations' },
    {
      $group: {
        _id: '$results.recommendations',
        count: { $sum: 1 },
        averageScore: { $avg: '$results.overallScore' },
      },
    },
    { $sort: { count: -1, averageScore: -1 } },
    { $limit: limit },
  ]);
};

// Helper method for ObjectId conversion in aggregation
cvAtsSchema.statics.convertToObjectId = function (id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error(`Invalid ObjectId: ${id}`);
};

const CvAtsModel = mongoose.model('CvAtsAnalysis', cvAtsSchema);

module.exports = {
  CvAtsModel,
  ATS_STATUS,
  ATS_TYPE,
  ATS_PRIORITY,
};

