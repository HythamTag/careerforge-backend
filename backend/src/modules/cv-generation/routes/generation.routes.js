// ============================================================================
// FILE: modules/cv-generation/routes/generation.routes.js
// ============================================================================

/**
 * CV GENERATION ROUTES
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('@middleware');
const {
  validateStartGenerationMiddleware,
  validatePreviewGenerationMiddleware,
  validateHistoryQueryMiddleware,
  validateJobIdParamsMiddleware,
} = require('../validators/generation.validator');

const GenerationController = require('../controllers/generation.controller');
const { resolve } = require('@core/container');

const generationService = resolve('generationService');
const generationController = new GenerationController(generationService);

// Generation routes
// Generation routes
/**
 * @openapi
 * /v1/generation:
 *   post:
 *     tags:
 *       - Generation
 *     summary: Start CV PDF generation
 *     description: Triggers the process of generating a PDF file for a specific CV version.
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
 *               - versionId
 *             properties:
 *               cvId:
 *                 type: string
 *               versionId:
 *                 type: string
 *               template:
 *                 type: string
 *                 example: 'modern'
 *     responses:
 *       202:
 *         description: Generation job started
 */
router.post(
  '/',
  authMiddleware,
  validateStartGenerationMiddleware,
  generationController.startGeneration.bind(generationController)
);

// Specific routes MUST be defined BEFORE wildcard /:jobId
router.get(
  '/history',
  authMiddleware,
  validateHistoryQueryMiddleware,
  generationController.getGenerationHistory.bind(generationController)
);

router.get(
  '/stats',
  authMiddleware,
  generationController.getGenerationStats.bind(generationController)
);

/**
 * @openapi
 * /v1/generation/preview:
 *   post:
 *     tags:
 *       - Generation
 *     summary: Generate CV preview (HTML)
 *     responses:
 *       200:
 *         description: Preview HTML returned successfully
 */
router.post(
  '/preview',
  authMiddleware,
  validatePreviewGenerationMiddleware,
  generationController.previewGeneration.bind(generationController)
);

/**
 * @openapi
 * /v1/generation/{jobId}:
 *   get:
 *     tags:
 *       - Generation
 *     summary: Get generation job status
 */
router.get(
  '/:jobId',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.getGenerationStatus.bind(generationController)
);

/**
 * @openapi
 * /v1/generation/{jobId}/download:
 *   get:
 *     tags:
 *       - Generation
 *     summary: Download generated PDF
 */
router.get(
  '/:jobId/download',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.downloadGeneration.bind(generationController)
);

router.post(
  '/:jobId/cancel',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.cancelGeneration.bind(generationController)
);

module.exports = router;
