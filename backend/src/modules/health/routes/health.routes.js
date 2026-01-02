/**
 * HEALTH ROUTES
 *
 * Route definitions for health monitoring endpoints.
 *
 * @module modules/health/routes/health.routes
 */
const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const {
  validatePerformanceQueryMiddleware,
  validateDetailedHealthQueryMiddleware,
} = require('../validators/health.validator');

// Initialize controller with service from container
const HealthController = require('../controllers/health.controller');
const healthService = resolve('healthService');
const healthController = new HealthController(healthService);

// Health check endpoints (no authentication required for monitoring)

// Health check endpoints (no authentication required for monitoring)

/**
 * @openapi
 * /v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     operationId: checkHealth
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: 'ok' }
 *                 timestamp: { type: string, format: date-time }
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: 'error' }
 */
router.get('/', healthController.getHealth.bind(healthController));

/**
 * @openapi
 * /v1/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     operationId: checkReadiness
 *     responses:
 *       200:
 *         description: System is ready to accept traffic
 *       503:
 *         description: System is not ready (e.g., db down)
 */
router.get('/ready', healthController.getReadiness.bind(healthController));

/**
 * @openapi
 * /v1/health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     operationId: checkLiveness
 *     responses:
 *       200:
 *         description: System is live
 *       503:
 *         description: System is dead
 */
router.get('/live', healthController.getLiveness.bind(healthController));

/**
 * @openapi
 * /v1/health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Detailed diagnostic health check
 *     operationId: checkDetailedHealth
 *     parameters:
 *       - in: query
 *         name: components
 *         schema: { type: string }
 *         description: Comma-separated list of components to check
 *     responses:
 *       200:
 *         description: Detailed health status
 *       503:
 *         description: One or more components unhealthy
 */
router.get('/detailed', validateDetailedHealthQueryMiddleware, healthController.getDetailedHealth.bind(healthController));

/**
 * @openapi
 * /v1/health/system:
 *   get:
 *     tags: [Health]
 *     summary: Get system info (OS, CPU, Memory)
 *     operationId: getSystemInfo
 *     responses:
 *       200:
 *         description: System info retrieved
 */
router.get('/system', healthController.getSystemInfo.bind(healthController));

/**
 * @openapi
 * /v1/health/performance:
 *   get:
 *     tags: [Health]
 *     summary: Get performance metrics
 *     operationId: getPerformanceMetrics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, default: '1h' }
 *     responses:
 *       200:
 *         description: Performance metrics retrieved
 */
router.get('/performance', validatePerformanceQueryMiddleware, healthController.getPerformanceMetrics.bind(healthController));

module.exports = router;

