/**
 * VALIDATION MIDDLEWARE
 *
 * Generic validation middleware using Ajv JSON schemas.
 * Provides consistent validation across all API endpoints.
 *
 * @module core/middleware/validation.middleware
 */

const { validateData } = require('@utils');
const { ERROR_CODES } = require('@constants');
const { ValidationError } = require('@errors');

/**
 * Create validation middleware for request data
 * @param {Object} schema - Ajv JSON schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    try {
      let data = req[property];

      const { valid, errors, data: validatedData } = validateData(data, schema);

      if (!valid) {
        const validationErrors = errors.map(error => ({
          field: error.instancePath.substring(1), // Remove leading slash
          message: error.message,
          code: ERROR_CODES.VALIDATION_ERROR,
        }));

        throw new ValidationError(
          'Request validation failed',
          ERROR_CODES.VALIDATION_ERROR,
          { validationErrors },
        );
      }

      // Attach validated data back to request
      req[property] = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create validation middleware for multiple request properties
 * @param {Object} schemas - Object mapping property names to schemas
 * @returns {Function} Express middleware function
 */
function validateRequestMultiple(schemas) {
  return (req, res, next) => {
    try {
      for (const [property, schema] of Object.entries(schemas)) {
        const data = req[property];
        const { valid, errors } = validateData(data, schema);

        if (!valid) {
          const validationErrors = errors.map(error => ({
            field: `${property}${error.instancePath}`,
            message: error.message,
            code: ERROR_CODES.VALIDATION_ERROR,
          }));

          throw new ValidationError(
            'Request validation failed',
            ERROR_CODES.VALIDATION_ERROR,
            { validationErrors },
          );
        }

        // Attach validated data back to request
        req[property] = data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create validation middleware for path parameters
 * @param {Object} schema - Schema for path parameters
 * @returns {Function} Express middleware function
 */
function validateParams(schema) {
  return validateRequest(schema, 'params');
}

/**
 * Create validation middleware for query parameters
 * @param {Object} schema - Schema for query parameters
 * @returns {Function} Express middleware function
 */
function validateQuery(schema) {
  return validateRequest(schema, 'query');
}

module.exports = {
  validateRequest,
  validateRequestMultiple,
  validateParams,
  validateQuery,
};

