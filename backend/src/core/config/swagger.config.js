/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CareerForge API',
            version: '1.0.0',
            description: 'AI-powered CV enhancement and optimization platform',
            contact: {
                name: 'CareerForge Team',
                email: 'support@careerforge.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://careerforge-backend-production.up.railway.app',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR'
                                },
                                message: {
                                    type: 'string',
                                    example: 'Invalid request data'
                                },
                                details: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        username: { type: 'string', example: 'johndoe' },
                        firstName: { type: 'string', example: 'John' },
                        lastName: { type: 'string', example: 'Doe' },
                        role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                        avatarUrl: { type: 'string', format: 'uri' },
                        isEmailVerified: { type: 'boolean', example: false },
                        subscription: {
                            type: 'object',
                            properties: {
                                plan: { type: 'string', enum: ['free', 'pro', 'enterprise'], example: 'free' },
                                status: { type: 'string', enum: ['active', 'canceled', 'expired'], example: 'active' }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Job: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '65842f77bcf86cd799439012' },
                        type: { type: 'string', enum: ['parsing', 'optimization', 'generation', 'ats-analysis'], example: 'parsing' },
                        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'canceled'], example: 'completed' },
                        priority: { type: 'integer', example: 10 },
                        progress: { type: 'number', minimum: 0, maximum: 100, example: 50 },
                        data: { type: 'object' },
                        result: { type: 'object' },
                        error: { type: 'object' },
                        startedAt: { type: 'string', format: 'date-time' },
                        completedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CVVersion: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '65842f77bcf86cd799439015' },
                        cvId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        versionNumber: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Initial Upload' },
                        description: { type: 'string', example: 'Original version from parsing' },
                        content: { type: 'object', description: 'Complete CV data snapshot' },
                        changeType: { type: 'string', enum: ['manual', 'optimization', 'parsing', 'import'], example: 'parsing' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                AtsAnalysis: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '85842f77bcf86cd799439014' },
                        cvId: { type: 'string' },
                        jobDescription: { type: 'string' },
                        score: { type: 'number', example: 85.5 },
                        feedback: { type: 'object' },
                        tailoringSuggestions: { type: 'array', items: { type: 'string' } }
                    }
                },
                CV: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        userId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        fileName: {
                            type: 'string',
                            example: 'resume.pdf'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'processing', 'completed', 'failed'],
                            example: 'completed'
                        },
                        parsingProgress: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            example: 100
                        },
                        parsedData: {
                            type: 'object',
                            properties: {
                                personalInfo: {
                                    type: 'object'
                                },
                                experience: {
                                    type: 'array',
                                    items: {
                                        type: 'object'
                                    }
                                },
                                education: {
                                    type: 'array',
                                    items: {
                                        type: 'object'
                                    }
                                },
                                skills: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                }
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and registration'
            },
            {
                name: 'Users',
                description: 'User management operations'
            },
            {
                name: 'CVs',
                description: 'CV upload, parsing, and management'
            },
            {
                name: 'Versions',
                description: 'CV version management and optimization'
            },
            {
                name: 'Generation',
                description: 'PDF generation from CV data'
            },
            {
                name: 'Health',
                description: 'System health and monitoring'
            }
        ]
    },
    apis: [
        './src/modules/*/routes/*.js',
        './src/modules/*/controllers/*.js',
        './src/routes/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
