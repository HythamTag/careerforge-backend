/**
 * CV Schemas
 * All schemas related to CV data structures.
 * 
 * @module core/config/swagger/schemas/cv.schemas
 */

module.exports = {
    // ========================================
    // CV Component Schemas (Building Blocks)
    // ========================================

    /**
     * Personal information section of a CV
     */
    CVPersonalInfo: {
        type: 'object',
        required: ['fullName', 'email'],
        properties: {
            fullName: {
                type: 'string',
                example: 'John Doe'
            },
            email: {
                type: 'string',
                format: 'email',
                example: 'john@example.com'
            },
            phone: {
                type: 'string',
                example: '+1 234 567 890'
            },
            location: {
                type: 'string',
                example: 'New York, NY'
            },
            urls: {
                type: 'array',
                items: { type: 'string', format: 'uri' },
                example: ['https://linkedin.com/in/johndoe', 'https://github.com/johndoe']
            }
        }
    },

    /**
     * Work experience entry
     */
    CVWorkExperience: {
        type: 'object',
        required: ['company', 'role', 'startDate'],
        properties: {
            company: {
                type: 'string',
                example: 'Tech Corp'
            },
            role: {
                type: 'string',
                example: 'Senior Developer'
            },
            startDate: {
                type: 'string',
                format: 'date'
            },
            endDate: {
                type: 'string',
                format: 'date',
                nullable: true,
                description: 'Null if current position'
            },
            description: {
                type: 'string',
                example: 'Led team of 5 developers...'
            },
            technologies: {
                type: 'array',
                items: { type: 'string' },
                example: ['JavaScript', 'React', 'Node.js']
            }
        }
    },

    /**
     * Education entry
     */
    CVEducation: {
        type: 'object',
        required: ['institution', 'degree', 'startDate'],
        properties: {
            institution: {
                type: 'string',
                example: 'University of Technology'
            },
            degree: {
                type: 'string',
                example: 'BS Computer Science'
            },
            startDate: {
                type: 'string',
                format: 'date'
            },
            endDate: {
                type: 'string',
                format: 'date',
                nullable: true
            },
            description: {
                type: 'string'
            }
        }
    },

    /**
     * Skill entry
     */
    CVSkill: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {
                type: 'string',
                example: 'JavaScript'
            },
            level: {
                type: 'string',
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                example: 'Expert'
            },
            category: {
                type: 'string',
                example: 'Programming Languages'
            }
        }
    },

    /**
     * Project entry
     */
    CVProject: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {
                type: 'string',
                example: 'E-commerce Platform'
            },
            description: {
                type: 'string',
                example: 'Built a full-stack e-commerce solution'
            },
            url: {
                type: 'string',
                format: 'uri'
            },
            technologies: {
                type: 'array',
                items: { type: 'string' },
                example: ['React', 'Node.js', 'MongoDB']
            },
            startDate: {
                type: 'string',
                format: 'date'
            },
            endDate: {
                type: 'string',
                format: 'date',
                nullable: true
            }
        }
    },

    /**
     * Certification entry
     */
    CVCertification: {
        type: 'object',
        required: ['name', 'issuer'],
        properties: {
            name: {
                type: 'string',
                example: 'AWS Solutions Architect'
            },
            issuer: {
                type: 'string',
                example: 'Amazon Web Services'
            },
            issueDate: {
                type: 'string',
                format: 'date'
            },
            expiryDate: {
                type: 'string',
                format: 'date',
                nullable: true
            },
            credentialId: {
                type: 'string'
            },
            credentialUrl: {
                type: 'string',
                format: 'uri'
            }
        }
    },

    // ========================================
    // Main CV Schemas
    // ========================================

    /**
     * Complete CV object
     */
    CV: {
        type: 'object',
        required: ['_id', 'userId', 'status', 'fileName'],
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
                enum: ['draft', 'published', 'archived', 'processing', 'failed', 'deleted'],
                example: 'published',
                description: 'Current status of the CV record (Draft, Published, Archived, etc.)'
            },
            published: {
                type: 'boolean',
                example: true,
                description: 'Whether the CV is publicly accessible via its public URL'
            },
            archived: {
                type: 'boolean',
                example: false,
                description: 'Whether the CV has been archived'
            },
            isParsed: {
                type: 'boolean',
                example: true,
                description: 'Whether the CV has been successfully parsed'
            },
            parsingStatus: {
                type: 'string',
                enum: ['pending', 'queued', 'processing', 'parsed', 'optimized', 'failed'],
                example: 'parsed',
                description: 'Detailed processing/parsing state'
            },
            parsingProgress: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 100,
                description: 'Parsing progress percentage'
            },
            parsedData: {
                type: 'object',
                description: 'Structured CV data extracted from document',
                properties: {
                    personalInfo: { $ref: '#/components/schemas/CVPersonalInfo' },
                    experience: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVWorkExperience' }
                    },
                    education: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVEducation' }
                    },
                    skills: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVSkill' }
                    },
                    languages: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    certifications: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVCertification' }
                    },
                    projects: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVProject' }
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
    },

    /**
     * CV version snapshot
     */
    CVVersion: {
        type: 'object',
        required: ['cvId', 'versionNumber', 'content'],
        properties: {
            _id: {
                type: 'string',
                example: '65842f77bcf86cd799439015'
            },
            cvId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011'
            },
            versionNumber: {
                type: 'integer',
                example: 1
            },
            name: {
                type: 'string',
                example: 'Initial Upload'
            },
            description: {
                type: 'string',
                example: 'Original version from parsing'
            },
            content: {
                type: 'object',
                description: 'Complete CV data snapshot',
                properties: {
                    personalInfo: { $ref: '#/components/schemas/CVPersonalInfo' },
                    experience: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVWorkExperience' }
                    },
                    education: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVEducation' }
                    },
                    skills: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/CVSkill' }
                    }
                }
            },
            changeType: {
                type: 'string',
                enum: ['manual', 'ai_optimized', 'parsing', 'import', 'system_generated'],
                example: 'ai_optimized',
                description: 'How this version was created'
            },
            isActive: {
                type: 'boolean',
                example: true,
                description: 'Whether this is the active version'
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    }
};
