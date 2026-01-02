/**
 * CV OPTIMIZER ROUTES
 *
 * Direct CV optimization endpoints without job orchestration.
 *
 * @module modules/cv-optimizer/routes/cv-optimizer.routes
 */

const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const {
  validateOptimizeCvMiddleware,
  validateOptimizeSectionsMiddleware,
  validateTailorForJobMiddleware,
  validateCapabilitiesQueryMiddleware,
} = require('../validators/cv-optimizer.validator');

const CVOptimizerService = resolve('cvOptimizerService');
const CVVersionService = resolve('cvVersionService');
const CVService = resolve('cvService');

const CVOptimizerController = require('../controllers/cv-optimizer.controller');
const cvOptimizerController = new CVOptimizerController(
  CVOptimizerService,
  CVVersionService,
  CVService
);

const { authMiddleware } = require('@middleware');

// All optimization routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /v1/optimize:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Optimize entire CV content
 *     description: Uses AI to enhance the entire content of a CV based on industry best practices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cvId
 *             properties:
 *               cvId:
 *                 type: string
 *               targetRole:
 *                 type: string
 *     responses:
 *       200:
 *         description: Optimization job started or completed
 */
router.post('/', validateOptimizeCvMiddleware, cvOptimizerController.optimizeCV.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/sections:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Optimize specific CV sections
 */
router.post('/sections', validateOptimizeSectionsMiddleware, cvOptimizerController.optimizeSections.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/tailor:
 *   post:
 *     tags:
 *       - CVs
 *     summary: Tailor CV for specific job
 */
router.post('/tailor', validateTailorForJobMiddleware, cvOptimizerController.tailorForJob.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/capabilities:
 *   get:
 *     tags:
 *       - CVs
 *     summary: Get optimization capabilities
 *     description: Returns a list of supported optimization features and models.
 *     responses:
 *       200:
 *         description: Capabilities returned
 */
router.get('/capabilities', validateCapabilitiesQueryMiddleware, cvOptimizerController.getCapabilities.bind(cvOptimizerController));

module.exports = router;
