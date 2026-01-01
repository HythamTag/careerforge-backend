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

// GET /v1/health - Basic health check
router.get('/', healthController.getHealth.bind(healthController));

// GET /v1/health/ready - Readiness check
router.get('/ready', healthController.getReadiness.bind(healthController));

// GET /v1/health/live - Liveness check
router.get('/live', healthController.getLiveness.bind(healthController));

// GET /v1/health/detailed - Detailed health information
router.get('/detailed', validateDetailedHealthQueryMiddleware, healthController.getDetailedHealth.bind(healthController));

// GET /v1/health/system - System information
router.get('/system', healthController.getSystemInfo.bind(healthController));

// GET /v1/health/performance - Performance metrics
router.get('/performance', validatePerformanceQueryMiddleware, healthController.getPerformanceMetrics.bind(healthController));

module.exports = router;

