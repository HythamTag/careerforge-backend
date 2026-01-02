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
 *     operationId: startGenerationjob
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Job' }
 *       400:
 *         description: Invalid input or missing template
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: CV or Version not found
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authMiddleware,
  validateStartGenerationMiddleware,
  generationController.startGeneration.bind(generationController)
);

// Specific routes MUST be defined BEFORE wildcard /:jobId
/**
 * @openapi
 * /v1/generation/history:
 *   get:
 *     tags:
 *       - Generation
 *     summary: Get generation history
 *     operationId: getGenerationHistory
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: History returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Job' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 */
router.get(
  '/history',
  authMiddleware,
  validateHistoryQueryMiddleware,
  generationController.getGenerationHistory.bind(generationController)
);

/**
 * @openapi
 * /v1/generation/stats:
 *   get:
 *     tags:
 *       - Generation
 *     summary: Get generation statistics
 *     operationId: getGenerationStats
 *     responses:
 *       200:
 *         description: Stats returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 */
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
 *     operationId: generatePreview
 *     responses:
 *       200:
 *         description: Preview HTML returned successfully
 *       400:
 *         description: Validation error
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: getGenerationJobStatus
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job status returned
 *         content:
 *           application/json:
 *             schema: 
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Job' }
 *       404:
 *         description: Job not found
 *         $ref: '#/components/schemas/Error'
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
 *     operationId: downloadGeneratedPDF
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File or Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/:jobId/download',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.downloadGeneration.bind(generationController)
);

/**
 * @openapi
 * /v1/generation/{jobId}/cancel:
 *   post:
 *     tags:
 *       - Generation
 *     summary: Cancel generation job
 *     operationId: cancelGenerationJob
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job cancelled
 *       404:
 *         description: Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/:jobId/cancel',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.cancelGeneration.bind(generationController)
);

module.exports = router;
