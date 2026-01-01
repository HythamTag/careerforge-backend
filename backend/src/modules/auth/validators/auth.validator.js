/**
 * AUTH VALIDATORS
 *
 * Validation schemas for authentication operations.
 *
 * @module modules/auth/validators/auth.validator
 */

const { validationMiddleware } = require('@middleware');
const { validateRequest, validateParams } = validationMiddleware;
const { STRING_LIMITS, VALIDATION_PATTERNS } = require('@constants');

// ==========================================
// SCHEMAS
// ==========================================

const registerSchema = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      minLength: STRING_LIMITS.EMAIL_MIN_LENGTH,
      maxLength: STRING_LIMITS.EMAIL_MAX_LENGTH,
    },
    password: {
      type: 'string',
      minLength: STRING_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: STRING_LIMITS.PASSWORD_MAX_LENGTH,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    },
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
  },
};

const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      minLength: STRING_LIMITS.EMAIL_MIN_LENGTH,
      maxLength: STRING_LIMITS.EMAIL_MAX_LENGTH,
    },
    password: {
      type: 'string',
      minLength: STRING_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: STRING_LIMITS.PASSWORD_MAX_LENGTH,
    },
  },
};

const refreshTokenSchema = {
  type: 'object',
  required: ['refreshToken'],
  additionalProperties: false,
  properties: {
    refreshToken: {
      type: 'string',
      minLength: 10,
      maxLength: 2000, // JWTs can be long
    },
  },
};

const forgotPasswordSchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      minLength: STRING_LIMITS.EMAIL_MIN_LENGTH,
      maxLength: STRING_LIMITS.EMAIL_MAX_LENGTH,
    },
  },
};

const resetPasswordSchema = {
  type: 'object',
  required: ['token', 'newPassword'],
  additionalProperties: false,
  properties: {
    token: {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
    },
    newPassword: {
      type: 'string',
      minLength: STRING_LIMITS.PASSWORD_MIN_LENGTH,
      maxLength: STRING_LIMITS.PASSWORD_MAX_LENGTH,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
    },
  },
};

const verifyEmailParamsSchema = {
  type: 'object',
  required: ['token'],
  additionalProperties: false,
  properties: {
    token: {
      type: 'string',
      minLength: 10,
      maxLength: 2000,
    },
  },
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

function validateRegister(data) {
  return require('@utils/validator').validateData(data, registerSchema);
}

function validateLogin(data) {
  return require('@utils/validator').validateData(data, loginSchema);
}

function validateRefreshToken(data) {
  return require('@utils/validator').validateData(data, refreshTokenSchema);
}

function validateForgotPassword(data) {
  return require('@utils/validator').validateData(data, forgotPasswordSchema);
}

function validateResetPassword(data) {
  return require('@utils/validator').validateData(data, resetPasswordSchema);
}

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

const validateRegisterMiddleware = validateRequest(registerSchema);
const validateLoginMiddleware = validateRequest(loginSchema);
const validateRefreshTokenMiddleware = validateRequest(refreshTokenSchema);
const validateForgotPasswordMiddleware = validateRequest(forgotPasswordSchema);
const validateResetPasswordMiddleware = validateRequest(resetPasswordSchema);
const validateVerifyEmailParamsMiddleware = validateParams(verifyEmailParamsSchema);

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailParamsSchema,

  // Validation functions
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,

  // Middleware
  validateRegisterMiddleware,
  validateLoginMiddleware,
  validateRefreshTokenMiddleware,
  validateForgotPasswordMiddleware,
  validateResetPasswordMiddleware,
  validateVerifyEmailParamsMiddleware,
};
