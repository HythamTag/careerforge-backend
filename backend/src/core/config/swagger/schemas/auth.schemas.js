/**
 * Authentication Schemas
 * Schemas related to authentication and authorization.
 * 
 * @module core/config/swagger/schemas/auth.schemas
 */

module.exports = {
    /**
     * JWT token pair returned after authentication
     */
    AuthTokens: {
        type: 'object',
        required: ['token', 'refreshToken'],
        properties: {
            token: {
                type: 'string',
                description: 'JWT access token (short-lived)',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
                type: 'string',
                description: 'JWT refresh token (long-lived)',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
                type: 'integer',
                example: 3600,
                description: 'Access token expiry in seconds'
            }
        }
    },

    /**
     * User subscription details
     */
    Subscription: {
        type: 'object',
        required: ['plan', 'status'],
        properties: {
            plan: {
                type: 'string',
                enum: ['free', 'pro', 'enterprise'],
                example: 'free',
                description: 'Current subscription tier'
            },
            status: {
                type: 'string',
                enum: ['active', 'canceled', 'expired', 'past_due'],
                example: 'active',
                description: 'Subscription status'
            },
            currentPeriodEnd: {
                type: 'string',
                format: 'date-time',
                description: 'When the current billing period ends'
            },
            cancelAtPeriodEnd: {
                type: 'boolean',
                example: false,
                description: 'Whether subscription will cancel at period end'
            }
        }
    }
};
