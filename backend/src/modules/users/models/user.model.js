/**
 * USER MODEL
 *
 * Database schema and model for user management.
 * Handles user authentication, profiles, subscriptions, and preferences.
 *
 * @module modules/users/models/user.model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { USER_STATUS, USER_ROLE, SUBSCRIPTION_STATUS, LOGIN_SECURITY, STRING_LIMITS, USER_LIMITS, NUMERIC_LIMITS, OUTPUT_FORMAT } = require('@constants');

// Subscription Plan Enum
const SUBSCRIPTION_PLAN = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
};

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format',
    },
  },

  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false, // Don't include in queries by default
  },

  // Profile Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: STRING_LIMITS.NAME_MAX_LENGTH,
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: STRING_LIMITS.NAME_MAX_LENGTH,
  },

  displayName: {
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.NAME_MAX_LENGTH,
  },

  avatar: {
    url: String,
    fileName: String,
    uploadedAt: Date,
  },

  // Contact Information
  phone: {
    type: String,
    trim: true,
  },

  timezone: {
    type: String,
    default: 'UTC',
  },

  // Account Status
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.PENDING_VERIFICATION,
  },

  role: {
    type: String,
    enum: Object.values(USER_ROLE),
    default: USER_ROLE.USER,
  },

  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false,
  },

  emailVerificationToken: {
    type: String,
    select: false,
  },

  emailVerificationExpires: Date,

  // Password Reset
  passwordResetToken: {
    type: String,
    select: false,
  },

  passwordResetExpires: Date,

  // Subscription Information
  subscription: {
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.FREE,
    },

    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLAN),
      default: SUBSCRIPTION_PLAN.FREE,
    },

    stripeCustomerId: String,

    stripeSubscriptionId: String,

    currentPeriodStart: Date,

    currentPeriodEnd: Date,

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },

    trialStart: Date,

    trialEnd: Date,

    features: {
      monthlyGenerations: {
        type: Number,
        default: USER_LIMITS.MAX_GENERATION_JOBS,
      },

      monthlyEnhancements: {
        type: Number,
        default: USER_LIMITS.MAX_ATS_ANALYSES,
      },

      monthlyAnalyses: {
        type: Number,
        default: USER_LIMITS.MAX_ATS_ANALYSES,
      },

      storageLimit: {
        type: Number,
        default: USER_LIMITS.MAX_STORAGE_MB, // MB
      },

      customTemplates: {
        type: Boolean,
        default: false,
      },

      prioritySupport: {
        type: Boolean,
        default: false,
      },

      apiAccess: {
        type: Boolean,
        default: false,
      },
    },
  },

  // Usage Statistics
  usageStats: {
    totalGenerations: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },

    totalEnhancements: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },

    totalAnalyses: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },

    storageUsed: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT, // MB
    },

    monthlyStats: {
      generations: {
        type: Number,
        default: NUMERIC_LIMITS.DEFAULT_COUNT,
      },

      enhancements: {
        type: Number,
        default: NUMERIC_LIMITS.DEFAULT_COUNT,
      },

      analyses: {
        type: Number,
        default: NUMERIC_LIMITS.DEFAULT_COUNT,
      },

      lastReset: {
        type: Date,
        default: Date.now,
      },
    },
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
    },

    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },

    notifications: {
      email: {
        type: Boolean,
        default: true,
      },

      jobCompleted: {
        type: Boolean,
        default: true,
      },

      weeklyReport: {
        type: Boolean,
        default: false,
      },

      marketing: {
        type: Boolean,
        default: false,
      },
    },

    defaultFormats: {
      generation: {
        type: String,
        enum: [OUTPUT_FORMAT.PDF, OUTPUT_FORMAT.HTML, OUTPUT_FORMAT.DOCX],
        default: OUTPUT_FORMAT.PDF,
      },
    },

    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'private',
      },

      analytics: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Security
  security: {
    lastLoginAt: Date,

    lastLoginIP: String,

    failedLoginAttempts: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },

    lockoutUntil: Date,

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    backupCodes: [{
      type: String,
      select: false,
    }],

    trustedDevices: [{
      deviceId: String,
      deviceName: String,
      lastUsed: Date,
      ipAddress: String,
    }],
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Social Links (optional)
  socialLinks: {
    linkedin: String,
    github: String,
    website: String,
    twitter: String,
  },

  // Referral Information
  referral: {
    referralCode: {
      type: String,
      // Note: unique constraint removed to avoid duplicate key issues
      // Referral codes should be generated when needed
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    referralsCount: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },

    referralCredits: {
      type: Number,
      default: NUMERIC_LIMITS.DEFAULT_COUNT,
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'users',
});

// Indexes for performance
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivityAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for subscription active status
userSchema.virtual('isSubscriptionActive').get(function () {
  return [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL].includes(this.subscription.status);
});

// Virtual for premium features
userSchema.virtual('hasPremiumFeatures').get(function () {
  return this.role === USER_ROLE.PREMIUM || this.isSubscriptionActive;
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hashPassword = async function () {
  this.password = await bcrypt.hash(this.password, 12);
};

userSchema.methods.updateLastActivity = function () {
  this.lastActivityAt = new Date();
  return this.save();
};

userSchema.methods.recordLogin = function (ipAddress) {
  this.security.lastLoginAt = new Date();
  this.security.lastLoginIP = ipAddress;
  this.security.failedLoginAttempts = 0;
  this.security.lockoutUntil = null;
  this.updateLastActivity();
};

userSchema.methods.recordFailedLogin = function () {
  this.security.failedLoginAttempts += 1;

  // Lock account after max failed attempts
  if (this.security.failedLoginAttempts >= LOGIN_SECURITY.MAX_FAILED_ATTEMPTS) {
    this.security.lockoutUntil = new Date(Date.now() + LOGIN_SECURITY.LOCKOUT_DURATION_MS);
  }
};

userSchema.methods.isLocked = function () {
  return this.security.lockoutUntil && this.security.lockoutUntil > new Date();
};

userSchema.methods.canResetPassword = function () {
  return this.passwordResetToken && this.passwordResetExpires > new Date();
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + LOGIN_SECURITY.EMAIL_VERIFICATION_EXPIRY_MS;
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + LOGIN_SECURITY.PASSWORD_RESET_EXPIRY_MS;
  return token;
};

userSchema.methods.generateReferralCode = function () {
  this.referral.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
};

userSchema.methods.incrementUsage = function (type, amount = 1) {
  if (type === 'generation') {
    this.usageStats.totalGenerations += amount;
    this.usageStats.monthlyStats.generations += amount;
  } else if (type === 'enhancement') {
    this.usageStats.totalEnhancements += amount;
    this.usageStats.monthlyStats.enhancements += amount;
  } else if (type === 'analysis') {
    this.usageStats.totalAnalyses += amount;
    this.usageStats.monthlyStats.analyses += amount;
  }
};

userSchema.methods.resetMonthlyUsage = function () {
  this.usageStats.monthlyStats.generations = 0;
  this.usageStats.monthlyStats.enhancements = 0;
  this.usageStats.monthlyStats.analyses = 0;
  this.usageStats.monthlyStats.lastReset = new Date();
};

userSchema.methods.hasReachedLimit = function (type) {
  const limits = this.subscription.features;

  if (type === 'generation') {
    return this.usageStats.monthlyStats.generations >= limits.monthlyGenerations;
  } else if (type === 'enhancement') {
    return this.usageStats.monthlyStats.enhancements >= limits.monthlyEnhancements;
  } else if (type === 'analysis') {
    return this.usageStats.monthlyStats.analyses >= limits.monthlyAnalyses;
  }

  return false;
};

userSchema.methods.getProfile = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    displayName: this.displayName,
    fullName: this.fullName,
    avatar: this.avatar,
    phone: this.phone,
    timezone: this.timezone,
    status: this.status,
    role: this.role,
    emailVerified: this.emailVerified,
    subscription: {
      status: this.subscription.status,
      plan: this.subscription.plan,
      currentPeriodEnd: this.subscription.currentPeriodEnd,
      features: this.subscription.features,
    },
    usageStats: {
      totalGenerations: this.usageStats.totalGenerations,
      totalEnhancements: this.usageStats.totalEnhancements,
      totalAnalyses: this.usageStats.totalAnalyses,
      monthlyStats: this.usageStats.monthlyStats,
    },
    preferences: this.preferences,
    socialLinks: this.socialLinks,
    createdAt: this.createdAt,
    lastActivityAt: this.lastActivityAt,
  };
};

// Pre-save middleware to hash password
userSchema.pre('save', async function () {
  // Only hash password if it has been modified
  if (!this.isModified('password')) { return; }

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// Pre-save middleware to generate referral code for new users
userSchema.pre('save', async function () {
  if (this.isNew && !this.referral.referralCode) {
    this.generateReferralCode();
  }
});

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

userSchema.statics.findActiveByEmail = function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    status: USER_STATUS.ACTIVE,
  });
};

userSchema.statics.findByReferralCode = function (referralCode) {
  return this.findOne({
    'referral.referralCode': referralCode.toUpperCase(),
  });
};

userSchema.statics.getSubscriptionStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$subscription.status',
        count: { $sum: 1 },
        plans: {
          $push: '$subscription.plan',
        },
      },
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);
};

userSchema.statics.getUsageStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalGenerations: { $sum: '$usageStats.totalGenerations' },
        totalEnhancements: { $sum: '$usageStats.totalEnhancements' },
        totalAnalyses: { $sum: '$usageStats.totalAnalyses' },
        avgGenerationsPerUser: { $avg: '$usageStats.totalGenerations' },
        avgEnhancementsPerUser: { $avg: '$usageStats.totalEnhancements' },
        avgAnalysesPerUser: { $avg: '$usageStats.totalAnalyses' },
      },
    },
  ]);
};

userSchema.statics.resetMonthlyUsageForAll = function () {
  return this.updateMany({}, [
    {
      $set: {
        'usageStats.monthlyStats.generations': 0,
        'usageStats.monthlyStats.enhancements': 0,
        'usageStats.monthlyStats.analyses': 0,
        'usageStats.monthlyStats.lastReset': new Date(),
      },
    },
  ]);
};

const UserModel = mongoose.model('User', userSchema);

module.exports = {
  UserModel,
  USER_STATUS,
  USER_ROLE,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLAN,
};

