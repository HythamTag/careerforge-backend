/**
 * CV PARSING VALIDATOR
 *
 * Validation schemas for CV parsing operations.
 *
 * @module modules/cv-parsing/validators/cv-parsing.validator
 */

const { ERROR_CODES } = require('@constants');
const { validateData } = require('@utils');
const { ErrorFactory } = require('@errors');

/**
 * Schema for starting CV parsing
 */
const startParsingSchema = {
  type: 'object',
  properties: {
    cvId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
    fileName: { type: 'string', minLength: 1, maxLength: 255 },
    fileType: { type: 'string', enum: ['pdf', 'docx', 'doc'] },
    priority: { type: 'string', enum: ['low', 'normal', 'high'] },
    parsingOptions: {
      type: 'object',
      properties: {
        extractSkills: { type: 'boolean' },
        extractExperience: { type: 'boolean' },
        extractEducation: { type: 'boolean' },
        extractProjects: { type: 'boolean' },
        extractCertifications: { type: 'boolean' },
        extractLanguages: { type: 'boolean' },
        extractPublications: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  required: ['cvId'],
  additionalProperties: false,
};

/**
 * Schema for parsing history query
 */
const historyQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'string', pattern: '^[0-9]+$' },
    limit: { type: 'string', pattern: '^[0-9]+$' },
    status: {
      oneOf: [
        { type: 'string' },
        { type: 'array', items: { type: 'string' } }
      ]
    },
    sortBy: { type: 'string' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
  },
  additionalProperties: true,
};

const cvParsingValidator = {
  validateStartParsing: (req, res, next) => {
    const { valid, errors } = validateData(req.body, startParsingSchema);
    if (!valid) return next(ErrorFactory.validationFailed('Invalid parsing request', ERROR_CODES.VALIDATION_ERROR, errors));
    next();
  },

  validateHistoryQuery: (req, res, next) => {
    const { valid, errors } = validateData(req.query, historyQuerySchema);
    if (!valid) return next(ErrorFactory.validationFailed('Invalid history query', ERROR_CODES.VALIDATION_ERROR, errors));
    next();
  },
};

module.exports = cvParsingValidator;
