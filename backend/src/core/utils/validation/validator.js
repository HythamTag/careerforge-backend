/**
 * VALIDATOR UTILITIES
 *
 * Comprehensive validation utilities using Ajv JSON schema validation.
 * Provides both schema-based and utility validation functions.
 *
 * @module core/utils/validator
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { VALIDATION_PATTERNS } = require('@constants');

// Configure Ajv instance with all formats and options
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: false, // Keep additional properties for validation only
  useDefaults: false, // Don't modify input data
  coerceTypes: true, // Coerce types (e.g., string "1" to number 1) for query params
  strict: true, // Strict mode for better error detection
});

// Add common formats
addFormats(ajv);

// Add custom formats
ajv.addFormat('objectId', VALIDATION_PATTERNS.MONGODB_OBJECT_ID);
ajv.addFormat('uuid', VALIDATION_PATTERNS.UUID);
ajv.addFormat('phone', VALIDATION_PATTERNS.PHONE);
ajv.addFormat('slug', VALIDATION_PATTERNS.SLUG);
ajv.addFormat('hexColor', VALIDATION_PATTERNS.HEX_COLOR);

/**
 * Validate data against a JSON schema
 * @param {any} data - Data to validate
 * @param {Object} schema - JSON schema
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateData(data, schema) {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    return {
      valid,
      errors: validate.errors,
      data, // Return mutated data (if coercion happened)
    };
  } catch (error) {
    // Schema compilation error
    return {
      valid: false,
      errors: [{
        instancePath: '',
        schemaPath: '',
        keyword: 'schema',
        params: {},
        message: `Schema compilation error: ${error.message}`,
      }],
    };
  }
}

/**
 * Compile a schema for repeated use
 * @param {Object} schema - JSON schema
 * @returns {Function} Compiled validation function
 */
function compileSchema(schema) {
  return ajv.compile(schema);
}

/**
 * Format validation errors for user-friendly display
 * @param {Array} errors - Ajv validation errors
 * @returns {Array} Formatted error objects
 */
function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.instancePath.substring(1),
    message: error.message,
    code: 'VALIDATION_ERROR',
    details: {
      keyword: error.keyword,
      params: error.params,
      schemaPath: error.schemaPath,
    },
  }));
}

/**
 * Legacy utility functions (kept for backward compatibility)
 * Consider migrating to schema-based validation
 */
const isEmail = (email) => VALIDATION_PATTERNS.EMAIL.test(email);
const isObjectId = (id) => VALIDATION_PATTERNS.MONGODB_OBJECT_ID.test(id);
const isNotEmpty = (value) => value != null && value !== '';

module.exports = {
  // Main validation functions
  validateData,
  compileSchema,
  formatValidationErrors,

  // Ajv instance for advanced usage
  ajv,

  // Legacy utility functions
  isEmail,
  isObjectId,
  isNotEmpty,
};

