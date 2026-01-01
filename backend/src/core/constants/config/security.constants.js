/**
 * ============================================================================
 * security.constants.js - Security & Crypto Constants (Pure Static)
 * ============================================================================
 */

const { TIME_CONSTANTS } = require('../core/time.constants');

/**
 * Cryptographic Constants
 * Security-related cryptographic parameters
 */
const CRYPTO = Object.freeze({
  /**
   * Webhook secret key length in bytes
   * 32 bytes = 256 bits (industry standard for HMAC secrets)
   */
  WEBHOOK_SECRET_BYTES: 32,
});

/**
 * Login Security Configuration
 * Authentication and account security settings
 */
const LOGIN_SECURITY = Object.freeze({
  /**
   * Maximum failed login attempts before account lockout
   * Prevents brute force attacks
   */
  MAX_FAILED_ATTEMPTS: 5,
  
  /**
   * Account lockout duration after max failed attempts
   * 15 minutes - balances security with user experience
   */
  LOCKOUT_DURATION_MS: 15 * TIME_CONSTANTS.MS_PER_MINUTE,
  
  /**
   * Email verification token expiry time
   * 24 hours - gives users reasonable time to verify
   */
  EMAIL_VERIFICATION_EXPIRY_MS: TIME_CONSTANTS.MS_PER_DAY,
  
  /**
   * Password reset token expiry time
   * 1 hour - security best practice for sensitive operations
   */
  PASSWORD_RESET_EXPIRY_MS: TIME_CONSTANTS.MS_PER_HOUR,
});

module.exports = {
  CRYPTO,
  LOGIN_SECURITY,
};

