/**
 * ============================================================================
 * utils/deep-freeze.js - Deep Freeze Utility
 * ============================================================================
 * 
 * Recursively freeze an object and all nested objects.
 */

/**
 * Recursively freeze an object and all nested objects
 * @param {any} obj - Object to freeze
 * @returns {any} Deeply frozen object
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Retrieve the property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = obj[name];

    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

module.exports = deepFreeze;

