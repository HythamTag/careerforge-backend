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
 *     responses:
 *       200: { description: 'System is healthy' }
 */
router.get('/', healthController.getHealth.bind(healthController));

/**
 * @openapi
 * /v1/health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 */
router.get('/ready', healthController.getReadiness.bind(healthController));

/**
 * @openapi
 * /v1/health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 */
router.get('/live', healthController.getLiveness.bind(healthController));

/**
 * @openapi
 * /v1/health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Detailed diagnostic health check
 */
router.get('/detailed', validateDetailedHealthQueryMiddleware, healthController.getDetailedHealth.bind(healthController));

/**
 * @openapi
 * /v1/health/system:
 *   get:
 *     tags: [Health]
 *     summary: Get system info (OS, CPU, Memory)
 */
router.get('/system', healthController.getSystemInfo.bind(healthController));

/**
 * @openapi
 * /v1/health/performance:
 *   get:
 *     tags: [Health]
 *     summary: Get performance metrics
 */
router.get('/performance', validatePerformanceQueryMiddleware, healthController.getPerformanceMetrics.bind(healthController));

module.exports = router;

