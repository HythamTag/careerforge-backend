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
 *       - Optimization
 *     summary: Optimize entire CV content
 *     description: Uses AI to enhance the entire content of a CV based on industry best practices.
 *     operationId: optimizeCVContent
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/CV' }
 *       400:
 *         description: Invalid input
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: CV not found
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', validateOptimizeCvMiddleware, cvOptimizerController.optimizeCV.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/sections:
 *   post:
 *     tags:
 *       - Optimization
 *     summary: Optimize specific CV sections
 *     operationId: optimizeCVSections
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cvId, sections]
 *             properties:
 *               cvId: { type: string }
 *               sections: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Optimization completed
 *       400:
 *         description: Invalid sections or input
 *         $ref: '#/components/schemas/Error'
 */
router.post('/sections', validateOptimizeSectionsMiddleware, cvOptimizerController.optimizeSections.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/tailor:
 *   post:
 *     tags:
 *       - Optimization
 *     summary: Tailor CV for specific job
 *     operationId: tailorCVForJob
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cvId, jobDescription]
 *             properties:
 *               cvId: { type: string }
 *               jobDescription: { type: string }
 *     responses:
 *       200:
 *         description: Tailoring started/completed
 *       400:
 *         description: Invalid input
 *         $ref: '#/components/schemas/Error'
 */
router.post('/tailor', validateTailorForJobMiddleware, cvOptimizerController.tailorForJob.bind(cvOptimizerController));

/**
 * @openapi
 * /v1/optimize/capabilities:
 *   get:
 *     tags:
 *       - Optimization
 *     summary: Get optimization capabilities
 *     description: Returns a list of supported optimization features and models.
 *     operationId: getOptimizationCapabilities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Capabilities returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/capabilities', validateCapabilitiesQueryMiddleware, cvOptimizerController.getCapabilities.bind(cvOptimizerController));

module.exports = router;
