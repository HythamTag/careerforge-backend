/**
 * ============================================================================
 * time.constants.js - Time and Duration Constants
 * ============================================================================
 */

const TIME_CONSTANTS = Object.freeze({
  // Base time conversion multipliers
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  DAYS_PER_QUARTER: 90,
  
  // Application-specific durations (computed once at module load)
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  EMAIL_VERIFICATION_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
  
  PASSWORD_RESET_EXPIRY_MINUTES: 60,
  PASSWORD_RESET_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
});

module.exports = {
  TIME_CONSTANTS,
};

