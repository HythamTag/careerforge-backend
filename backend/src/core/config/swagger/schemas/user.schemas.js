/**
 * User Schemas
 * Schemas related to user profiles and accounts.
 * 
 * @module core/config/swagger/schemas/user.schemas
 */

module.exports = {
    /**
     * User profile object
     */
    User: {
        type: 'object',
        required: ['_id', 'email', 'username', 'role'],
        properties: {
            _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
                description: 'Unique user identifier'
            },
            email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com'
            },
            username: {
                type: 'string',
                example: 'johndoe'
            },
            firstName: {
                type: 'string',
                example: 'John'
            },
            lastName: {
                type: 'string',
                example: 'Doe'
            },
            role: {
                type: 'string',
                enum: ['user', 'admin'],
                example: 'user'
            },
            avatarUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL to user avatar image'
            },
            isEmailVerified: {
                type: 'boolean',
                example: false
            },
            subscription: {
                $ref: '#/components/schemas/Subscription'
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    }
};
