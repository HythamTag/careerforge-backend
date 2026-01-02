/**
 * API Tags
 * Defines tag groups for organizing endpoints in Swagger UI.
 * 
 * @module core/config/swagger/tags
 */

module.exports = [
    // ========================================
    // Core & Authentication
    // ========================================
    {
        name: 'Health',
        description: '🏥 System health and monitoring endpoints'
    },
    {
        name: 'Authentication',
        description: '🔐 User registration, login, and token management'
    },
    {
        name: 'Users',
        description: '👤 User profile and account management'
    },

    // ========================================
    // CV Management
    // ========================================
    {
        name: 'CVs',
        description: '📄 CV upload, parsing, and CRUD operations'
    },
    {
        name: 'Versions',
        description: '📚 CV version history and snapshots'
    },

    // ========================================
    // AI Features
    // ========================================
    {
        name: 'CV ATS',
        description: '🎯 ATS compatibility analysis and scoring'
    },
    {
        name: 'Optimization',
        description: '✨ AI-powered CV optimization and tailoring'
    },
    {
        name: 'Generation',
        description: '📝 PDF generation from CV data'
    },

    // ========================================
    // System
    // ========================================
    {
        name: 'Jobs',
        description: '⚙️ Background job management and monitoring'
    }
];
