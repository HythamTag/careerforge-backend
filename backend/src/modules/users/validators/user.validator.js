/**
 * USER VALIDATORS
 *
 * Validation schemas for user management operations.
 *
 * @module modules/users/validators/user.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest } = validationMiddleware;
const { STRING_LIMITS } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const updateProfileSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    firstName: {
      type: 'string',
      minLength: STRING_LIMITS.NAME_MIN_LENGTH,
      maxLength: STRING_LIMITS.NAME_MAX_LENGTH,
      pattern: '^[a-zA-Z\\s\\-\']+$',
    },
    lastName: {
      type: 'string',
      minLength: STRING_LIMITS.NAME_MIN_LENGTH,
      maxLength: STRING_LIMITS.NAME_MAX_LENGTH,
      pattern: '^[a-zA-Z\\s\\-\']+$',
    },
    phone: {
      type: 'string',
      format: 'phone',
      minLength: STRING_LIMITS.PHONE_MIN_LENGTH,
      maxLength: STRING_LIMITS.PHONE_MAX_LENGTH,
    },
    linkedin: {
      type: 'string',
      format: 'uri',
      maxLength: STRING_LIMITS.URL_MAX_LENGTH,
    },
    github: {
      type: 'string',
      format: 'uri',
      maxLength: STRING_LIMITS.URL_MAX_LENGTH,
    },
    website: {
      type: 'string',
      format: 'uri',
      maxLength: STRING_LIMITS.URL_MAX_LENGTH,
    },
  },
  // At least one property must be present
  anyOf: [
    { required: ['firstName'] },
    { required: ['lastName'] },
    { required: ['phone'] },
    { required: ['linkedin'] },
    { required: ['github'] },
    { required: ['website'] },
  ],
};

const changePasswordSchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    currentPassword: {
      type: 'string',
      minLength: STRING_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: STRING_LIMITS.PASSWORD_MAX_LENGTH,
    },
    newPassword: {
      type: 'string',
      minLength: STRING_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: STRING_LIMITS.PASSWORD_MAX_LENGTH,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    },
  },
};

const updateSubscriptionSchema = {
  type: 'object',
  required: ['plan'],
  additionalProperties: false,
  properties: {
    plan: {
      type: 'string',
      enum: ['free', 'basic', 'pro', 'enterprise'],
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateUpdateProfile(data) {
  return require('@utils/validator').validateData(data, updateProfileSchema);
}

function validateChangePassword(data) {
  return require('@utils/validator').validateData(data, changePasswordSchema);
}

function validateUpdateSubscription(data) {
  return require('@utils/validator').validateData(data, updateSubscriptionSchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateUpdateProfileMiddleware = validateRequest(updateProfileSchema);
const validateChangePasswordMiddleware = validateRequest(changePasswordSchema);
const validateUpdateSubscriptionMiddleware = validateRequest(updateSubscriptionSchema);

module.exports = {
  // Schemas
  updateProfileSchema,
  changePasswordSchema,
  updateSubscriptionSchema,

  // Validation functions
  validateUpdateProfile,
  validateChangePassword,
  validateUpdateSubscription,

  // Middleware
  validateUpdateProfileMiddleware,
  validateChangePasswordMiddleware,
  validateUpdateSubscriptionMiddleware,
};
