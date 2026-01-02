/**
 * Core Schemas
 * Generic response and utility schemas used across all endpoints.
 * 
 * @module core/config/swagger/schemas/core.schemas
 */

module.exports = {
    /**
     * Standard error response format
     */
    Error: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
            success: {
                type: 'boolean',
                example: false
            },
            error: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                    code: {
                        type: 'string',
                        example: 'VALIDATION_ERROR',
                        description: 'Machine-readable error code'
                    },
                    message: {
                        type: 'string',
                        example: 'Invalid request data',
                        description: 'Human-readable error message'
                    },
                    details: {
                        type: 'object',
                        description: 'Additional error context'
                    }
                }
            }
        }
    },

    /**
     * Pagination metadata for list endpoints
     */
    Pagination: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages'],
        properties: {
            page: {
                type: 'integer',
                minimum: 1,
                default: 1,
                description: 'Current page number'
            },
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
                description: 'Items per page'
            },
            total: {
                type: 'integer',
                description: 'Total number of items'
            },
            totalPages: {
                type: 'integer',
                description: 'Total number of pages'
            },
            hasNext: {
                type: 'boolean',
                description: 'Whether there is a next page'
            },
            hasPrev: {
                type: 'boolean',
                description: 'Whether there is a previous page'
            }
        }
    },

    /**
     * Generic success response wrapper
     */
    SuccessResponse: {
        type: 'object',
        required: ['success'],
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Operation completed successfully'
            },
            data: {
                type: 'object',
                description: 'Response payload'
            }
        }
    }
};
