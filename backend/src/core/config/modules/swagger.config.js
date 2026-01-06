/**
 * SWAGGER CONFIGURATION
 * 
 * OpenAPI 3.0 specification configuration for CV Enhancer API.
 * Pure configuration object - no middleware setup.
 * 
 * Best Practices Applied:
 * - OpenAPI 3.0.0 standard
 * - Centralized schemas for reusability
 * - Environment-aware server URLs
 */

const { SERVICE_VERSION } = require('@constants');
const config = require('@config');

/**
 * Swagger/OpenAPI configuration options
 * @type {Object}
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CV Enhancer API v1',
      version: SERVICE_VERSION,
      description: `
## Overview
The CV Enhancer API v1 provides comprehensive endpoints for managing, processing, and optimizing professional CVs.

## API Versions
- **v1** (Current): Full-featured API with background jobs, webhooks, and advanced features

## Features
- **CV Management**: Create, update, archive, and version control CVs
- **AI-Powered Parsing**: Extract structured data from PDF/DOCX uploads
- **ATS Optimization**: Tailor resumes for Applicant Tracking Systems
- **PDF/DOCX Generation**: Professional document output with templates
- **Background Jobs**: Asynchronous processing for heavy operations
- **Webhooks**: Real-time notifications for job completions
- **Version Control**: Git-like version management for CV changes

## Authentication
JWT-based authentication required for most endpoints.

## Rate Limiting
- Upload endpoints: 10 requests per minute per IP
- Other endpoints: 100 requests per minute per IP
- Background jobs: Unlimited (processed asynchronously)
      `,
      contact: {
        name: 'Backend Team',
        email: 'backend@cv-enhancer.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: config.server.baseUrl,
        description: config.server.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /v1/auth/login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ERR_4001' },
                message: { type: 'string', example: 'CV not found' },
                details: { type: 'object' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/**/*.js',
    './src/modules/**/routes/*.js',
    './src/modules/**/controllers/*.js',
  ],
};

module.exports = {
  swaggerOptions,
};

