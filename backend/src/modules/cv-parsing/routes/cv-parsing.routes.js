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
 * @route POST /v1/parse
 * @desc Start a CV parsing job
 * @access Private
 */
router.post(
  '/',
  authMiddleware,
  validator.validateStartParsing,
  controller.startParsing.bind(controller)
);

/**
 * @route GET /v1/parse/history
 * @desc Get user's parsing job history
 * @access Private
 */
router.get(
  '/history',
  authMiddleware,
  validator.validateHistoryQuery,
  controller.getParsingHistory.bind(controller)
);

/**
 * @route GET /v1/parse/stats
 * @desc Get user's parsing statistics
 * @access Private
 */
router.get(
  '/stats',
  authMiddleware,
  controller.getParsingStats.bind(controller)
);

/**
 * @route GET /v1/parse/formats
 * @desc Get supported file formats
 * @access Private
 */
router.get(
  '/formats',
  authMiddleware,
  controller.getSupportedFormats.bind(controller)
);

/**
 * @route GET /v1/parse/:jobId
 * @desc Get parsing job status
 * @access Private
 */
router.get(
  '/:jobId',
  authMiddleware,
  controller.getJobStatus.bind(controller)
);

/**
 * @route GET /v1/parse/:jobId/result
 * @desc Get parsing job result
 * @access Private
 */
router.get(
  '/:jobId/result',
  authMiddleware,
  controller.getJobResult.bind(controller)
);

/**
 * @route POST /v1/parse/:jobId/cancel
 * @desc Cancel a pending/processing parsing job
 * @access Private
 */
router.post(
  '/:jobId/cancel',
  authMiddleware,
  controller.cancelJob.bind(controller)
);

/**
 * @route POST /v1/parse/:jobId/retry
 * @desc Retry a failed parsing job
 * @access Private
 */
router.post(
  '/:jobId/retry',
  authMiddleware,
  controller.retryJob.bind(controller)
);

module.exports = router;