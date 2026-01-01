/**
 * WEBHOOK MODEL
 *
 * Database schema and model for webhook configurations and delivery tracking.
 * Handles webhook endpoints, events, security, and delivery attempts.
 *
 * @module modules/webhooks/models/webhook.model
 */

const mongoose = require('mongoose');
const { WEBHOOK_STATUS, WEBHOOK_EVENT, WEBHOOK_DELIVERY_STATUS: DELIVERY_STATUS, HTTP_STATUS_RANGES, WEBHOOK, WEBHOOK_VALIDATION, WEBHOOK_RETRY_CONFIG, STRING_LIMITS, NUMERIC_LIMITS } = require('@constants');
const { ownsResource } = require('@utils');

const webhookSchema = new mongoose.Schema({
  // User Association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Webhook Configuration
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: STRING_LIMITS.NAME_MAX_LENGTH,
  },

  description: {
    type: String,
    trim: true,
    maxLength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
  },

  url: {
    type: String,
    required: true,
    trim: true,
    maxLength: WEBHOOK.URL_MAX_LENGTH,
    validate: {
      validator: function(v) {
        // Basic URL validation
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP or HTTPS URL',
    },
  },

  // Event Subscriptions
  events: [{
    type: String,
    enum: Object.values(WEBHOOK_EVENT),
    required: true,
  }],

  // Status
  status: {
    type: String,
    enum: Object.values(WEBHOOK_STATUS),
    default: WEBHOOK_STATUS.ACTIVE,
    index: true,
  },

  // Security
  secret: {
    type: String,
    required: true,
    select: false, // Don't include in queries by default
    maxLength: WEBHOOK.SECRET_MAX_LENGTH,
  },

  // Delivery Configuration
  retryPolicy: {
    maxRetries: {
      type: Number,
      default: WEBHOOK_RETRY_CONFIG.MAX_RETRIES,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: WEBHOOK.MAX_RETRY_ATTEMPTS,
    },
    retryDelay: {
      type: Number,
      default: WEBHOOK.BASE_RETRY_DELAY_MS, // milliseconds
      min: WEBHOOK.BASE_RETRY_DELAY_MS,
      max: WEBHOOK.MAX_RETRY_DELAY_MS, // 5 minutes
    },
    backoffMultiplier: {
      type: Number,
      default: WEBHOOK_RETRY_CONFIG.BACKOFF_MULTIPLIER,
      min: NUMERIC_LIMITS.MIN_VERSION_NUMBER,
      max: WEBHOOK_RETRY_CONFIG.MAX_RETRIES,
    },
  },

  timeout: {
    type: Number,
    default: WEBHOOK.DEFAULT_TIMEOUT_MS, // 30 seconds
    min: WEBHOOK.MIN_TIMEOUT_MS,
    max: WEBHOOK.MAX_TIMEOUT_MS, // 2 minutes
  },

  // Filters (optional event filtering)
  filters: {
    jobTypes: [{
      type: String,
      enum: ['generation', 'enhancement', 'ats_analysis', 'parsing'],
    }],
    minScore: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    maxScore: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    cvIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
    }],
  },

  // Headers (custom headers to send with webhook)
  headers: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Delivery Statistics
  deliveryStats: {
    totalDeliveries: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
    successfulDeliveries: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
    failedDeliveries: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
    lastDeliveryAt: Date,
    lastSuccessAt: Date,
    lastFailureAt: Date,
    consecutiveFailures: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
  },

  // Metadata
  tags: [{
    type: String,
    index: true,
    maxLength: STRING_LIMITS.TAG_MAX_LENGTH,
  }],

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  suspendedAt: Date,
  lastTriggeredAt: Date,
}, {
  timestamps: true,
  collection: 'webhooks',
});

// Indexes for performance
webhookSchema.index({ userId: 1, status: 1 });
webhookSchema.index({ events: 1 });
webhookSchema.index({ status: 1, 'deliveryStats.lastDeliveryAt': -1 });
webhookSchema.index({ 'deliveryStats.consecutiveFailures': 1 });

// Virtual for success rate
webhookSchema.virtual('successRate').get(function() {
  if (this.deliveryStats.totalDeliveries === 0) {return 0;}
  return (this.deliveryStats.successfulDeliveries / this.deliveryStats.totalDeliveries) * WEBHOOK.SUCCESS_RATE_MULTIPLIER;
});

// Instance methods
webhookSchema.methods.isActive = function() {
  return this.status === WEBHOOK_STATUS.ACTIVE;
};

webhookSchema.methods.isSuspended = function() {
  return this.status === WEBHOOK_STATUS.SUSPENDED;
};

webhookSchema.methods.shouldRetry = function() {
  return this.deliveryStats.consecutiveFailures < this.retryPolicy.maxRetries;
};

webhookSchema.methods.recordSuccessfulDelivery = function() {
  this.deliveryStats.totalDeliveries += 1;
  this.deliveryStats.successfulDeliveries += 1;
  this.deliveryStats.lastDeliveryAt = new Date();
  this.deliveryStats.lastSuccessAt = new Date();
  this.deliveryStats.consecutiveFailures = 0;

  if (this.status === WEBHOOK_STATUS.SUSPENDED && this.successRate >= WEBHOOK_VALIDATION.SUCCESS_RATE_THRESHOLD) {
    this.status = WEBHOOK_STATUS.ACTIVE;
    this.suspendedAt = null;
  }
};

webhookSchema.methods.recordFailedDelivery = function() {
  this.deliveryStats.totalDeliveries += 1;
  this.deliveryStats.failedDeliveries += 1;
  this.deliveryStats.lastDeliveryAt = new Date();
  this.deliveryStats.lastFailureAt = new Date();
  this.deliveryStats.consecutiveFailures += 1;

  // Auto-suspend if too many consecutive failures
  if (this.deliveryStats.consecutiveFailures >= 5) {
    this.status = WEBHOOK_STATUS.SUSPENDED;
    this.suspendedAt = new Date();
  }
};

webhookSchema.methods.updateLastTriggered = function() {
  this.lastTriggeredAt = new Date();
};

webhookSchema.methods.matchesEvent = function(eventType, eventData = {}) {
  // Check if webhook subscribes to this event
  if (!this.events.includes(eventType)) {
    return false;
  }

  // Apply filters if they exist
  if (this.filters.jobTypes && eventData.jobType) {
    if (!this.filters.jobTypes.includes(eventData.jobType)) {
      return false;
    }
  }

  if (this.filters.minScore !== undefined && eventData.score !== undefined) {
    if (eventData.score < this.filters.minScore) {
      return false;
    }
  }

  if (this.filters.maxScore !== undefined && eventData.score !== undefined) {
    if (eventData.score > this.filters.maxScore) {
      return false;
    }
  }

  if (this.filters.cvIds && eventData.cvId) {
    if (!this.filters.cvIds.some(id => ownsResource(id, eventData.cvId))) {
      return false;
    }
  }

  return true;
};

webhookSchema.methods.suspend = function() {
  this.status = WEBHOOK_STATUS.SUSPENDED;
  this.suspendedAt = new Date();
};

webhookSchema.methods.activate = function() {
  this.status = WEBHOOK_STATUS.ACTIVE;
  this.suspendedAt = null;
};

webhookSchema.methods.generateSignature = function(payload, timestamp) {
  const crypto = require('crypto');
  const payloadString = JSON.stringify(payload);
  const signatureString = timestamp + '.' + payloadString;
  return crypto.createHmac('sha256', this.secret).update(signatureString).digest('hex');
};

// Static methods
webhookSchema.statics.findActiveByEvent = async function(eventType, eventData = {}) {
  const webhooks = await this.find({
    status: WEBHOOK_STATUS.ACTIVE,
    events: eventType,
  });
  return webhooks.filter(webhook => webhook.matchesEvent(eventType, eventData));
};

webhookSchema.statics.findByUserId = function(userId, filters = {}) {
  const query = { userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.events) {
    query.events = { $in: filters.events };
  }

  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { url: new RegExp(filters.search, 'i') },
    ];
  }

  let dbQuery = this.find(query);

  // Sorting
  if (filters.sort) {
    dbQuery = dbQuery.sort(filters.sort);
  } else {
    dbQuery = dbQuery.sort({ createdAt: -1 });
  }

  // Pagination
  if (filters.limit) {
    dbQuery = dbQuery.limit(filters.limit);
  }

  if (filters.skip) {
    dbQuery = dbQuery.skip(filters.skip);
  }

  return dbQuery.exec();
};

webhookSchema.statics.countByUserId = function(userId, filters = {}) {
  const query = { userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.events) {
    query.events = { $in: filters.events };
  }

  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') },
      { url: new RegExp(filters.search, 'i') },
    ];
  }

  return this.countDocuments(query);
};

webhookSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', WEBHOOK_STATUS.ACTIVE] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', WEBHOOK_STATUS.INACTIVE] }, 1, 0] },
        },
        suspended: {
          $sum: { $cond: [{ $eq: ['$status', WEBHOOK_STATUS.SUSPENDED] }, 1, 0] },
        },
        totalDeliveries: { $sum: '$deliveryStats.totalDeliveries' },
        successfulDeliveries: { $sum: '$deliveryStats.successfulDeliveries' },
        failedDeliveries: { $sum: '$deliveryStats.failedDeliveries' },
      },
    },
  ]);
};

const WebhookModel = mongoose.model('Webhook', webhookSchema);

// Webhook Delivery Model
const webhookDeliverySchema = new mongoose.Schema({
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true,
  },

  eventType: {
    type: String,
    enum: Object.values(WEBHOOK_EVENT),
    required: true,
  },

  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  status: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING,
    index: true,
  },

  attempts: [{
    attemptNumber: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    statusCode: Number,
    response: mongoose.Schema.Types.Mixed,
    error: mongoose.Schema.Types.Mixed,
    duration: Number, // milliseconds
  }],

  nextRetryAt: Date,

  deliveredAt: Date,

  signature: {
    type: String,
    maxLength: WEBHOOK.SIGNATURE_MAX_LENGTH,
  },

  userAgent: {
    type: String,
    default: 'CV-Enhancer-Webhook/1.0',
    maxLength: WEBHOOK.USER_AGENT_MAX_LENGTH,
  },
}, {
  timestamps: true,
  collection: 'webhook_deliveries',
});

// Indexes for webhook deliveries
webhookDeliverySchema.index({ webhookId: 1, status: 1 });
webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });
webhookDeliverySchema.index({ eventType: 1 });
webhookDeliverySchema.index({ createdAt: -1 });

webhookDeliverySchema.methods.recordAttempt = function(statusCode, response, error, duration) {
  const attemptNumber = this.attempts.length + 1;

  this.attempts.push({
    attemptNumber,
    timestamp: new Date(),
    statusCode,
    response,
    error,
    duration,
  });

  if (HTTP_STATUS_RANGES.isSuccess(statusCode)) {
    this.status = DELIVERY_STATUS.SUCCESS;
    this.deliveredAt = new Date();
  } else {
    if (attemptNumber >= WEBHOOK_RETRY_CONFIG.MAX_RETRIES) {
      this.status = DELIVERY_STATUS.EXHAUSTED;
    } else {
      this.status = DELIVERY_STATUS.RETRYING;
      // Set next retry with exponential backoff
      const delay = Math.min(WEBHOOK_RETRY_CONFIG.BASE_DELAY_MS * Math.pow(WEBHOOK_RETRY_CONFIG.BACKOFF_MULTIPLIER, attemptNumber - 1), WEBHOOK_RETRY_CONFIG.MAX_DELAY_MS);
      this.nextRetryAt = new Date(Date.now() + delay);
    }
  }
};

webhookDeliverySchema.methods.shouldRetry = function() {
  return this.status === DELIVERY_STATUS.RETRYING &&
           this.attempts.length < WEBHOOK_RETRY_CONFIG.MAX_RETRIES &&
           (!this.nextRetryAt || this.nextRetryAt <= new Date());
};

const WebhookDeliveryModel = mongoose.model('WebhookDelivery', webhookDeliverySchema);

module.exports = {
  WebhookModel,
  WebhookDeliveryModel,
  WEBHOOK_STATUS,
  WEBHOOK_EVENT,
  DELIVERY_STATUS,
};

