/**
 * ============================================================================
 * user.constants.js - User Management Constants
 * ============================================================================
 */

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification',
});

const USER_ROLE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  PREMIUM: 'premium',
});

const SUBSCRIPTION_STATUS = Object.freeze({
  FREE: 'free',
  TRIAL: 'trial',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due',
});

const VERSION_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
});

const VERSION_SOURCE = Object.freeze({
  MANUAL: 'manual',
  AUTO_SAVE: 'auto_save',
  GENERATED: 'generated',
  OPTIMIZED: 'optimized',
  IMPORTED: 'imported',
});

module.exports = {
  USER_STATUS,
  USER_ROLE,
  SUBSCRIPTION_STATUS,
  VERSION_STATUS,
  VERSION_SOURCE,
};

