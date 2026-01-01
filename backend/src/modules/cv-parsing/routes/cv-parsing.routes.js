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
 *       - CVs
 *     summary: Start a CV parsing job
 *     description: Triggers the AI parsing process for a previously uploaded CV.
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
 *       - CVs
 *     summary: Get user's parsing job history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History returned successfully
 */
router.get(
  '/history',
  authMiddleware,
  validator.validateHistoryQuery,
  controller.getParsingHistory.bind(controller)
);

router.get(
  '/stats',
  authMiddleware,
  controller.getParsingStats.bind(controller)
);

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
 *       - CVs
 *     summary: Get parsing job status
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: job status returned successfully
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
 *       - CVs
 *     summary: Get parsing job result
 *     responses:
 *       200:
 *         description: Job result returned
 */
router.get(
  '/:jobId/result',
  authMiddleware,
  controller.getJobResult.bind(controller)
);

router.post(
  '/:jobId/cancel',
  authMiddleware,
  controller.cancelJob.bind(controller)
);

router.post(
  '/:jobId/retry',
  authMiddleware,
  controller.retryJob.bind(controller)
);

module.exports = router;