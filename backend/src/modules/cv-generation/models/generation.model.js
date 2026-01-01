// ============================================================================
// FILE: modules/cv-generation/models/generation.model.js
// ============================================================================

/**
 * GENERATION JOB MODEL
 *
 * Database schema for CV generation job tracking.
 * Simplified - business logic moved to service layer.
 */

const mongoose = require('mongoose');
const {
  GENERATION_STATUS,
  GENERATION_TYPE,
  OUTPUT_FORMAT,
  JOB_LIMITS,
  NUMERIC_LIMITS,
} = require('@constants');

const generationSchema = new mongoose.Schema({
  // Job Reference
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required'],
    index: true,
    unique: true,
  },

  // User Association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },

  // Source Data
  cvId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CV',
    default: null,
  },

  versionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
    default: null,
  },

  // Generation Configuration
  type: {
    type: String,
    enum: Object.values(GENERATION_TYPE),
    default: GENERATION_TYPE.FROM_CV,
  },

  outputFormat: {
    type: String,
    enum: Object.values(OUTPUT_FORMAT),
    default: OUTPUT_FORMAT.PDF,
  },

  // Template Information
  templateId: {
    type: String,
    default: null,
  },

  templateConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Job Status
  status: {
    type: String,
    enum: Object.values(GENERATION_STATUS),
    default: GENERATION_STATUS.PENDING,
    index: true,
  },

  // Progress Tracking
  progress: {
    type: Number,
    default: 0,
    min: NUMERIC_LIMITS.PROGRESS_MIN,
    max: NUMERIC_LIMITS.PROGRESS_MAX,
  },

  currentStep: {
    type: String,
    default: null,
  },

  totalSteps: {
    type: Number,
    default: 0,
  },

  // Generation Parameters
  parameters: {
    quality: {
      type: String,
      enum: ['draft', 'standard', 'high', 'premium'],
      default: 'standard',
    },
    includeSections: [String],
    excludeSections: [String],
    customizations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      title: String,
      author: String,
      subject: String,
      keywords: [String],
    },
  },

  // Input Data (snapshot)
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Output Information
  outputFile: {
    fileName: String,
    filePath: String,
    s3Key: String,
    fileSize: Number,
    mimeType: String,
    url: String,
    downloadUrl: String,
    expiresAt: Date,
  },

  // Generation Metadata
  generationStats: {
    totalSections: Number,
    renderedSections: Number,
    wordCount: Number,
    pageCount: Number,
    processingTimeMs: Number,
    templateVersion: String,
  },

  // Quality Metrics
  qualityScore: {
    type: Number,
    min: NUMERIC_LIMITS.SCORE_MIN,
    max: NUMERIC_LIMITS.SCORE_MAX,
    default: null,
  },

  // Error Handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
  },

  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: JOB_LIMITS.MAX_RETRIES,
  },

  // Metadata
  tags: [{
    type: String,
    index: true,
  }],

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Timestamps
  queuedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
}, {
  timestamps: true,
  collection: 'generation_jobs',
});

// Indexes
generationSchema.index({ userId: 1, status: 1 });
generationSchema.index({ cvId: 1, type: 1 });
generationSchema.index({ status: 1, queuedAt: 1 });
generationSchema.index({ status: 1, createdAt: -1 });
generationSchema.index({ outputFormat: 1 });
generationSchema.index({ templateId: 1 });

// Virtual for processing duration
generationSchema.virtual('processingDuration').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

// Simple helper methods (no business logic)
generationSchema.methods.isPending = function () {
  return this.status === GENERATION_STATUS.PENDING;
};

generationSchema.methods.isProcessing = function () {
  return this.status === GENERATION_STATUS.PROCESSING;
};

generationSchema.methods.isCompleted = function () {
  return this.status === GENERATION_STATUS.COMPLETED;
};

generationSchema.methods.isFailed = function () {
  return this.status === GENERATION_STATUS.FAILED;
};

generationSchema.methods.canBeCancelled = function () {
  return [GENERATION_STATUS.PENDING, GENERATION_STATUS.PROCESSING].includes(this.status);
};

generationSchema.methods.canBeRetried = function () {
  return this.retryCount < JOB_LIMITS.DEFAULT_RETRIES &&
    [GENERATION_STATUS.FAILED, GENERATION_STATUS.TIMEOUT].includes(this.status);
};

const GenerationModel = mongoose.model('GenerationJob', generationSchema);

module.exports = {
  GenerationModel,
  GENERATION_STATUS,
  GENERATION_TYPE,
  OUTPUT_FORMAT,
};

