/**
 * CV PARSING ROUTES
 *
 * Defines API endpoints for CV parsing operations.
 *
 * @module modules/cv-parsing/routes/cv-parsing.routes
 */

const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const { authMiddleware } = require('@middleware');
const validator = require('../validators/cv-parsing.validator');

// Resolve controller from container
const controller = resolve('cvParsingController');

/**
 * @openapi
 * /v1/parse:
 *   post:
 *     tags:
 *       - Parsing
 *     summary: Start a CV parsing job
 *     description: Triggers the AI parsing process for a previously uploaded CV.
 *     operationId: startParsingJob
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
 *                 description: ID of the uploaded CV
 *     responses:
 *       202:
 *         description: Parsing job started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *       400:
 *         description: Invalid input or file
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: CV not found
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authMiddleware,
  validator.validateStartParsing,
  controller.startParsing.bind(controller)
);

/**
 * @openapi
 * /v1/parse/history:
 *   get:
 *     tags:
 *       - Parsing
 *     summary: Get user's parsing job history
 *     operationId: getParsingHistory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History returned successfully
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/history',
  authMiddleware,
  validator.validateHistoryQuery,
  controller.getParsingHistory.bind(controller)
);

/**
 * @openapi
 * /v1/parse/stats:
 *   get:
 *     tags:
 *       - Parsing
 *     summary: Get parsing statistics
 *     operationId: getParsingStats
 *     responses:
 *       200:
 *         description: Parsing statistics returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/stats',
  authMiddleware,
  controller.getParsingStats.bind(controller)
);

/**
 * @openapi
 * /v1/parse/formats:
 *   get:
 *     tags:
 *       - Parsing
 *     summary: Get supported CV formats
 *     operationId: getSupportedFormats
 *     responses:
 *       200:
 *         description: List of supported formats
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/formats',
  authMiddleware,
  controller.getSupportedFormats.bind(controller)
);

/**
 * @openapi
 * /v1/parse/{jobId}:
 *   get:
 *     tags:
 *       - Parsing
 *     summary: Get parsing job status
 *     operationId: getParsingJobStatus
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: job status returned successfully
 *       404:
 *         description: Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/:jobId',
  authMiddleware,
  controller.getJobStatus.bind(controller)
);

/**
 * @openapi
 * /v1/parse/{jobId}/result:
 *   get:
 *     tags:
 *       - Parsing
 *     summary: Get parsing job result
 *     operationId: getParsingJobResult
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job result returned
 *       404:
 *         description: Job or Result not found
 *         $ref: '#/components/schemas/Error'
 */
router.get(
  '/:jobId/result',
  authMiddleware,
  controller.getJobResult.bind(controller)
);

/**
 * @openapi
 * /v1/parse/{jobId}/cancel:
 *   post:
 *     tags:
 *       - Parsing
 *     summary: Cancel parsing job
 *     operationId: cancelParsingJob
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
  controller.cancelJob.bind(controller)
);

/**
 * @openapi
 * /v1/parse/{jobId}/retry:
 *   post:
 *     tags:
 *       - Parsing
 *     summary: Retry parsing job
 *     operationId: retryParsingJob
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job retry started
 *       404:
 *         description: Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.post(
  '/:jobId/retry',
  authMiddleware,
  controller.retryJob.bind(controller)
);

module.exports = router;