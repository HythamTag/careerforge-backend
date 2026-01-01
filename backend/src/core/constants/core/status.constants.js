/**
 * ============================================================================
 * status.constants.js - Status Constants (Pure Static)
 * ============================================================================
 */

/**
 * Operation Status States
 * Generic status for any operation
 */
const OPERATION_STATUS = Object.freeze({
    SUCCESS: 'success',
    ERROR: 'error',
    PENDING: 'pending',
});

/**
 * Health Status States
 * Service health check statuses
 */
const HEALTH_STATUS = Object.freeze({
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    READY: 'ready',
    NOT_READY: 'not_ready',
});

module.exports = {
    OPERATION_STATUS,
    HEALTH_STATUS,
};
