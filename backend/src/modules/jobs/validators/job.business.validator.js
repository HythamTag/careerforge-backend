/**
 * JOB VALIDATOR
 * 
 * Validates job-related data and inputs.
 */

const { JOB_TYPE, JOB_STATUS, JOB_PRIORITY, NUMERIC_LIMITS, ERROR_CODES } = require('@constants');
const { ValidationError } = require('@errors');

class JobValidator {
  validateJobType(type) {
    if (!Object.values(JOB_TYPE).includes(type)) {
      throw new ValidationError(`Invalid job type: ${type}`, ERROR_CODES.INVALID_JOB_TYPE);
    }
  }

  validateJobData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Job data must be a valid object', ERROR_CODES.INVALID_JOB_DATA);
    }
  }

  validateJobOptions(options) {
    if (options && typeof options !== 'object') {
      throw new ValidationError('Job options must be a valid object', ERROR_CODES.INVALID_JOB_OPTIONS);
    }
    if (options.priority && !Object.values(JOB_PRIORITY).includes(options.priority)) {
      throw new ValidationError(`Invalid priority: ${options.priority}`, ERROR_CODES.INVALID_PRIORITY);
    }
  }

  validateJobId(jobId) {
    if (!jobId || typeof jobId !== 'string') {
      throw new ValidationError('Invalid Job ID', ERROR_CODES.INVALID_JOB_ID);
    }
  }

  validateUserId(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required', ERROR_CODES.MISSING_USER_ID);
    }
  }

  validateEntityId(id) {
    if (!id) {
      throw new ValidationError('Entity ID is required', ERROR_CODES.MISSING_ENTITY_ID);
    }
  }

  validateTags(tags) {
    if (!Array.isArray(tags)) {
      throw new ValidationError('Tags must be an array', ERROR_CODES.INVALID_TAGS);
    }
  }

  validateJobStatus(status) {
    if (!Object.values(JOB_STATUS).includes(status)) {
      throw new ValidationError(`Invalid status: ${status}`, ERROR_CODES.INVALID_STATUS);
    }
  }

  validateProgress(progress, currentStep, totalSteps) {
    if (typeof progress !== 'number' || progress < NUMERIC_LIMITS.PROGRESS_MIN || progress > NUMERIC_LIMITS.PROGRESS_MAX) {
      throw new ValidationError(`Progress must be between ${NUMERIC_LIMITS.PROGRESS_MIN} and ${NUMERIC_LIMITS.PROGRESS_MAX}`, ERROR_CODES.INVALID_PROGRESS);
    }
    if (currentStep !== null && totalSteps !== null) {
      if (currentStep < 0 || currentStep > totalSteps) {
        throw new ValidationError('Invalid step values', ERROR_CODES.INVALID_STEPS);
      }
    }
  }
}

module.exports = JobValidator;
