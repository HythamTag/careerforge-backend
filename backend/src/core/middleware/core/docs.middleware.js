/**
 * DOCS MIDDLEWARE
 * 
 * Express middleware setup for Swagger/OpenAPI documentation.
 * Configuration is separated into swagger.config.js.
 * 
 * This file handles:
 * - Swagger UI setup
 * - OpenAPI spec generation
 * - Route registration
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('@utils/logger');
const { swaggerOptions } = require('../../config/modules/swagger.config');

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 * 
 * @param {Express.Application} app - Express application instance
 */
function setupSwagger(app) {
  // Serve Swagger UI at /api-docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'CV Enhancer API Docs',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .info .title { color: #4F46E5 }
      `,
      explorer: true,
    }),
  );

  // Serve raw OpenAPI JSON at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('📚 Swagger UI available at http://localhost:5000/api-docs');
}

module.exports = { setupSwagger, swaggerSpec };

