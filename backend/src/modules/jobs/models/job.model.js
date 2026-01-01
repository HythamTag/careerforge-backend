/**
 * JOB MODEL
 *
 * Database schema and model for background jobs.
 * Supports various job types with status tracking and result storage.
 *
 * @module modules/jobs/models/job.model
 */

const mongoose = require('mongoose');

const { JOB_STATUS, JOB_TYPE, JOB_PRIORITY, NUMERIC_LIMITS, JOB_LIMITS, PAGINATION } = require('@constants');

const jobSchema = new mongoose.Schema({
  // Job Identification
  jobId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: Object.values(JOB_TYPE),
    required: true,
    index: true,
  },

  // Job Status & Lifecycle
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.PENDING,
    index: true,
  },
  priority: {
    type: Number,
    enum: Object.values(JOB_PRIORITY),
    default: JOB_PRIORITY.NORMAL,
  },

  // Job Data & Configuration
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Progress Tracking
  progress: {
    type: Number,
    min: NUMERIC_LIMITS.PROGRESS_MIN,
    max: NUMERIC_LIMITS.PROGRESS_MAX,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  currentStep: {
    type: String,
    default: null,
  },
  totalSteps: {
    type: Number,
    default: null,
  },

  // Results & Output
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  error: {
    message: String,
    code: String,
    stack: String,
    details: mongoose.Schema.Types.Mixed,
  },

  // Retry Logic
  retryCount: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
    min: NUMERIC_LIMITS.SCORE_MIN,
  },
  maxRetries: {
    type: Number,
    default: JOB_LIMITS.DEFAULT_RETRIES,
    min: JOB_LIMITS.MIN_RETRIES,
    max: JOB_LIMITS.MAX_RETRIES,
  },
  nextRetryAt: {
    type: Date,
    default: null,
  },

  // Timing
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Relationships
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  relatedEntityId: {
    type: String,
    description: 'ID of related entity (CV, version, etc.)',
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
}, {
  timestamps: true,
  collection: 'jobs',
});

// Indexes for performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ relatedEntityId: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for duration
jobSchema.virtual('duration').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  if (this.startedAt) {
    return Date.now() - this.startedAt;
  }
  return null;
});

// Instance methods
jobSchema.methods.isCompleted = function () {
  return this.status === JOB_STATUS.COMPLETED;
};

jobSchema.methods.isFailed = function () {
  return this.status === JOB_STATUS.FAILED;
};

jobSchema.methods.isActive = function () {
  return [JOB_STATUS.PENDING, JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING, JOB_STATUS.RETRYING].includes(this.status);
};

jobSchema.methods.canRetry = function () {
  return this.retryCount < this.maxRetries && !this.isCompleted();
};

jobSchema.methods.markAsStarted = function () {
  this.status = JOB_STATUS.PROCESSING;
  this.startedAt = new Date();
  this.updatedAt = new Date();
};

jobSchema.methods.markAsCompleted = function (result = null) {
  this.status = JOB_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.result = result;
  this.updatedAt = new Date();
};

jobSchema.methods.markAsFailed = function (error = null) {
  this.status = JOB_STATUS.FAILED;
  this.completedAt = new Date();
  this.error = error;
  this.updatedAt = new Date();
};

jobSchema.methods.scheduleRetry = function (delayMs = JOB_LIMITS.DEFAULT_RETRY_DELAY_MS) {
  this.status = JOB_STATUS.RETRYING;
  this.retryCount += 1;
  this.nextRetryAt = new Date(Date.now() + delayMs);
  this.updatedAt = new Date();
};

// Static methods
jobSchema.statics.findByJobId = function (jobId) {
  return this.findOne({ jobId });
};

jobSchema.statics.findByUser = function (userId, options = {}) {
  const query = { userId };
  if (options.status) {query.status = options.status;}
  if (options.type) {query.type = options.type;}

  return this.find(query)
    .sort(options.sort ? options.sort : { createdAt: -1 })
    .limit(options.limit ? options.limit : PAGINATION.DEFAULT_LIMIT)
    .skip(options.skip ? options.skip : 0);
};

jobSchema.statics.findActiveJobs = function () {
  return this.find({
    status: { $in: [JOB_STATUS.PENDING, JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING, JOB_STATUS.RETRYING] },
  });
};

jobSchema.statics.findFailedJobs = function () {
  return this.find({ status: JOB_STATUS.FAILED });
};

// Pre-save middleware
jobSchema.pre('save', async function () {
  this.updatedAt = new Date();
});

const JobModel = mongoose.model('Job', jobSchema);

module.exports = {
  JobModel,
  JOB_STATUS,
  JOB_TYPE,
  JOB_PRIORITY,
};

