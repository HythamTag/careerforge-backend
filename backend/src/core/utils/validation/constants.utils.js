/**
 * ============================================================================
 * constants.utils.js - Constants Utility Functions (Pure Functions)
 * ============================================================================
 * 
 * Pure utility functions for working with constants.
 * These are NOT constants themselves, but helper functions.
 * 
 * @module core/utils/constants.utils
 */

const JobConstants = require('../../constants/domain/job.constants');
const HttpConstants = require('../../constants/core/http.constants');
const ErrorConstants = require('../../constants/core/error.constants');

/**
 * Validate if a status is a valid job status
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid job status
 */
function isValidJobStatus(status) {
  return Object.values(JobConstants.JOB_STATUS).includes(status);
}

/**
 * Validate if a type is a valid job type
 * 
 * @param {string} type - Type to validate
 * @returns {boolean} True if valid job type
 */
function isValidJobType(type) {
  return Object.values(JobConstants.JOB_TYPE).includes(type);
}

/**
 * Validate if a code is a valid HTTP status code
 * 
 * @param {number} code - HTTP status code to validate
 * @returns {boolean} True if valid HTTP status code
 */
function isValidHttpStatus(code) {
  return Object.values(HttpConstants.HTTP_STATUS).includes(code);
}

/**
 * Validate if a job status transition is allowed
 * 
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean} True if transition is allowed
 */
function isValidTransition(from, to) {
  return JobConstants.JOB_STATUS_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Get error message for an error code
 * 
 * @param {string} code - Error code
 * @returns {string} Error message or default unknown error message
 */
function getErrorMessage(code) {
  return ErrorConstants.ERROR_MESSAGES[code] || 
    ErrorConstants.ERROR_MESSAGES[ErrorConstants.ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Get HTTP status message for a status code
 * 
 * @param {number} code - HTTP status code
 * @returns {string} HTTP status message
 */
function getHttpMessage(code) {
  return HttpConstants.HTTP_MESSAGES[code];
}

module.exports = {
  isValidJobStatus,
  isValidJobType,
  isValidHttpStatus,
  isValidTransition,
  getErrorMessage,
  getHttpMessage,
};

