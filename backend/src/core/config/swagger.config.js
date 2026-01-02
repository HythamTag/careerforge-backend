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
                    required: ['success', 'error'],
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            required: ['code', 'message'],
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Invalid request data' },
                                details: { type: 'object' }
                            }
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', minimum: 1, default: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        hasNext: { type: 'boolean' },
                        hasPrev: { type: 'boolean' }
                    }
                },
                User: {
                    type: 'object',
                    required: ['_id', 'email', 'username', 'role'],
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
                CVPersonalInfo: {
                    type: 'object',
                    required: ['fullName', 'email'],
                    properties: {
                        fullName: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        phone: { type: 'string', example: '+1 234 567 890' },
                        location: { type: 'string', example: 'New York, NY' },
                        urls: {
                            type: 'array',
                            items: { type: 'string', format: 'uri' },
                            example: ['https://linkedin.com/in/johndoe']
                        }
                    }
                },
                CVWorkExperience: {
                    type: 'object',
                    required: ['company', 'role', 'startDate'],
                    properties: {
                        company: { type: 'string', example: 'Tech Corp' },
                        role: { type: 'string', example: 'Senior Developer' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date', nullable: true },
                        description: { type: 'string', example: 'Led team of 5 developers...' },
                        technologies: { type: 'array', items: { type: 'string' } }
                    }
                },
                CVEducation: {
                    type: 'object',
                    required: ['institution', 'degree', 'startDate'],
                    properties: {
                        institution: { type: 'string', example: 'University of Tech' },
                        degree: { type: 'string', example: 'BS Computer Science' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date', nullable: true },
                        description: { type: 'string' }
                    }
                },
                CVSkill: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'JavaScript' },
                        level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Expert'], example: 'Expert' },
                        category: { type: 'string', example: 'Programming Languages' }
                    }
                },
                CV: {
                    type: 'object',
                    required: ['_id', 'userId', 'status', 'fileName'],
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        fileName: { type: 'string', example: 'resume.pdf' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'processing', 'completed', 'failed'],
                            example: 'completed'
                        },
                        parsingProgress: { type: 'number', minimum: 0, maximum: 100, example: 100 },
                        parsedData: {
                            type: 'object',
                            properties: {
                                personalInfo: { $ref: '#/components/schemas/CVPersonalInfo' },
                                experience: { type: 'array', items: { $ref: '#/components/schemas/CVWorkExperience' } },
                                education: { type: 'array', items: { $ref: '#/components/schemas/CVEducation' } },
                                skills: { type: 'array', items: { $ref: '#/components/schemas/CVSkill' } },
                                languages: { type: 'array', items: { type: 'string' } },
                                certifications: { type: 'array', items: { type: 'object' } },
                                projects: { type: 'array', items: { type: 'object' } }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CVVersion: {
                    type: 'object',
                    required: ['cvId', 'versionNumber', 'content'],
                    properties: {
                        _id: { type: 'string', example: '65842f77bcf86cd799439015' },
                        cvId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        versionNumber: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Initial Upload' },
                        description: { type: 'string', example: 'Original version from parsing' },
                        content: {
                            type: 'object',
                            description: 'Complete CV data snapshot',
                            properties: {
                                personalInfo: { $ref: '#/components/schemas/CVPersonalInfo' },
                                experience: { type: 'array', items: { $ref: '#/components/schemas/CVWorkExperience' } },
                                education: { type: 'array', items: { $ref: '#/components/schemas/CVEducation' } },
                                skills: { type: 'array', items: { $ref: '#/components/schemas/CVSkill' } }
                            }
                        },
                        changeType: { type: 'string', enum: ['manual', 'optimization', 'parsing', 'import'], example: 'parsing' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Job: {
                    type: 'object',
                    required: ['type', 'status'],
                    properties: {
                        _id: { type: 'string', example: '65842f77bcf86cd799439012' },
                        type: { type: 'string', enum: ['parsing', 'optimization', 'generation', 'ats-analysis'], example: 'parsing' },
                        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'canceled'], example: 'completed' },
                        priority: { type: 'integer', example: 10 },
                        progress: { type: 'number', minimum: 0, maximum: 100, example: 50 },
                        data: { type: 'object', description: 'Input data for the job' },
                        result: { type: 'object', description: 'Output result of the job' },
                        error: { type: 'object', description: 'Error details if failed' },
                        startedAt: { type: 'string', format: 'date-time' },
                        completedAt: { type: 'string', format: 'date-time' }
                    }
                },
                AtsAnalysis: {
                    type: 'object',
                    required: ['cvId', 'score'],
                    properties: {
                        _id: { type: 'string', example: '85842f77bcf86cd799439014' },
                        cvId: { type: 'string' },
                        jobDescription: { type: 'string' },
                        score: { type: 'number', example: 85.5 },
                        feedback: { type: 'object', description: 'Detailed analysis feedback' },
                        tailoringSuggestions: { type: 'array', items: { type: 'string' } }
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
