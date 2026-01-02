/**
 * Swagger/OpenAPI Configuration
 * 
 * Main entry point for API documentation.
 * Auto-generates documentation from JSDoc comments in route files.
 * 
 * @module core/config/swagger
 */

const swaggerJsdoc = require('swagger-jsdoc');
const schemas = require('./schemas');
const tags = require('./tags');

// ========================================
// API Information
// ========================================
const info = {
    title: 'CareerForge API',
    version: '1.0.0',
    description: `
# CareerForge API

AI-powered CV enhancement and optimization platform.

## Features
- 📄 CV upload and AI parsing
- ✨ AI-powered content optimization
- 🎯 ATS compatibility analysis
- 📝 Professional PDF generation
- 📚 Version history management

## Authentication
Most endpoints require a JWT token. Include it in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`
    `,
    contact: {
        name: 'CareerForge Team',
        email: 'support@careerforge.com'
    },
    license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
    }
};

// ========================================
// Server Definitions
// ========================================
const servers = [
    {
        url: 'http://localhost:5000',
        description: '🔧 Development Server'
    },
    {
        url: 'https://careerforge-backend-production.up.railway.app',
        description: '🚀 Production Server (Railway)'
    }
];

// ========================================
// Security Schemes
// ========================================
const securitySchemes = {
    bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token'
    }
};

// ========================================
// OpenAPI Specification
// ========================================
const options = {
    definition: {
        openapi: '3.0.0',
        info,
        servers,
        components: {
            securitySchemes,
            schemas
        },
        security: [
            { bearerAuth: [] }
        ],
        tags
    },
    apis: [
        './src/modules/*/routes/*.js',
        './src/modules/*/controllers/*.js',
        './src/routes/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
