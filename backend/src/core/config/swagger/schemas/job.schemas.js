/**
 * Job & Analysis Schemas
 * Schemas for background jobs and ATS analysis.
 * 
 * @module core/config/swagger/schemas/job.schemas
 */

module.exports = {
    /**
     * Background job object
     */
    Job: {
        type: 'object',
        required: ['type', 'status'],
        properties: {
            _id: {
                type: 'string',
                example: '65842f77bcf86cd799439012'
            },
            userId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
                description: 'Owner of this job'
            },
            type: {
                type: 'string',
                enum: ['cv_parsing', 'cv_optimization', 'cv_generation', 'cv_enhancement', 'ats_analysis', 'webhook_delivery'],
                example: 'cv_parsing',
                description: 'Type of background job'
            },
            status: {
                type: 'string',
                enum: ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying', 'timeout'],
                example: 'completed',
                description: 'Current job status'
            },
            priority: {
                type: 'integer',
                example: 10,
                description: 'Job priority (higher = sooner)'
            },
            progress: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                example: 50,
                description: 'Completion percentage'
            },
            data: {
                type: 'object',
                description: 'Input data for the job'
            },
            result: {
                type: 'object',
                description: 'Output result of the job'
            },
            error: {
                type: 'object',
                description: 'Error details if failed'
            },
            startedAt: {
                type: 'string',
                format: 'date-time'
            },
            completedAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    },

    /**
     * ATS (Applicant Tracking System) analysis result
     */
    AtsAnalysis: {
        type: 'object',
        required: ['cvId', 'score'],
        properties: {
            _id: {
                type: 'string',
                example: '85842f77bcf86cd799439014'
            },
            cvId: {
                type: 'string',
                description: 'ID of the analyzed CV'
            },
            jobDescription: {
                type: 'string',
                description: 'Job description used for analysis'
            },
            score: {
                type: 'number',
                example: 85.5,
                description: 'ATS compatibility score (0-100)'
            },
            matchedKeywords: {
                type: 'array',
                items: { type: 'string' },
                example: ['JavaScript', 'React', 'Node.js'],
                description: 'Keywords found in both CV and job description'
            },
            missingKeywords: {
                type: 'array',
                items: { type: 'string' },
                example: ['TypeScript', 'AWS', 'Docker'],
                description: 'Keywords in job description but not in CV'
            },
            feedback: {
                type: 'object',
                description: 'Detailed analysis feedback and suggestions'
            },
            tailoringSuggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific suggestions to improve ATS score'
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    }
};
