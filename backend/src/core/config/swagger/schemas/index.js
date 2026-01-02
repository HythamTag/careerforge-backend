/**
 * Schema Index
 * Combines all schema modules into a single export.
 * 
 * @module core/config/swagger/schemas
 */

const coreSchemas = require('./core.schemas');
const authSchemas = require('./auth.schemas');
const userSchemas = require('./user.schemas');
const cvSchemas = require('./cv.schemas');
const jobSchemas = require('./job.schemas');

/**
 * All OpenAPI schemas combined
 * Order matters for Swagger UI display
 */
module.exports = {
    // Core (displayed first)
    ...coreSchemas,

    // Authentication
    ...authSchemas,

    // User
    ...userSchemas,

    // CV Domain (most important)
    ...cvSchemas,

    // Jobs & Analysis
    ...jobSchemas
};
