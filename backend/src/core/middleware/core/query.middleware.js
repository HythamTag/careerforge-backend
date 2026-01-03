/**
 * Query Parameter Middleware
 * Standardizes filtering and expansion across all endpoints.
 * 
 * @module middleware/query.middleware
 */

/**
 * Parse and validate cvId query parameter
 */
function parseCvIdFilter(req, res, next) {
    if (req.query.cvId) {
        req.filters = req.filters || {};
        req.filters.cvId = req.query.cvId;
    }
    next();
}

/**
 * Parse and validate userId filter
 * Supports 'me' keyword for current user
 */
function parseUserIdFilter(req, res, next) {
    if (req.query.userId) {
        req.filters = req.filters || {};
        req.filters.userId = req.query.userId === 'me' ? req.userId : req.query.userId;
    }
    next();
}

/**
 * Parse and validate type filter for jobs
 */
function parseTypeFilter(req, res, next) {
    if (req.query.type) {
        req.filters = req.filters || {};
        req.filters.type = req.query.type;
    }
    next();
}

/**
 * Parse expand parameter (Stripe pattern)
 * Supports: ?expand=user,versions or ?expand[]=user&expand[]=versions
 */
function parseExpandParameter(req, res, next) {
    if (req.query.expand) {
        req.expand = Array.isArray(req.query.expand)
            ? req.query.expand
            : req.query.expand.split(',').map(e => e.trim());

        // Limit expansion depth to prevent circular references
        if (req.expand.length > 5) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'ERR_1001',
                    message: 'Maximum of 5 expand parameters allowed'
                }
            });
        }
    } else {
        req.expand = [];
    }
    next();
}

module.exports = {
    parseCvIdFilter,
    parseUserIdFilter,
    parseTypeFilter,
    parseExpandParameter
};
