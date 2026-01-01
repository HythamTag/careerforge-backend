/**
 * OWNERSHIP UTILITIES
 *
 * Utility functions for checking resource ownership.
 *
 * @module core/utils/ownership
 */

/**
 * Check if a user owns a resource
 *
 * @param {string|Object} resourceUserId - Resource user ID (can be ObjectId or string)
 * @param {string} userId - Current user ID
 * @returns {boolean} True if user owns the resource
 */
function ownsResource(resourceUserId, userId) {
  if (!resourceUserId || !userId) {
    return false;
  }
  return resourceUserId.toString() === userId.toString();
}

/**
 * Check if a user owns a resource, throw ForbiddenError if not
 *
 * @param {string|Object} resourceUserId - Resource user ID (can be ObjectId or string)
 * @param {string} userId - Current user ID
 * @param {string} resourceName - Name of the resource (for error message)
 * @param {string} errorCode - Error code to use
 * @throws {ForbiddenError} If user doesn't own the resource
 */
function requireOwnership(resourceUserId, userId, resourceName = 'Resource', errorCode) {
  if (!ownsResource(resourceUserId, userId)) {
    const { ErrorFactory } = require('@errors');
    throw ErrorFactory.forbidden(
      `Access denied: You don't own this ${resourceName.toLowerCase()}`
    );
  }
}

module.exports = {
  ownsResource,
  requireOwnership,
};

