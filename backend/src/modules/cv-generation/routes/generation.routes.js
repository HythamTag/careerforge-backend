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

router.post(
  '/preview',
  authMiddleware,
  validatePreviewGenerationMiddleware,
  generationController.previewGeneration.bind(generationController)
);

router.get(
  '/:jobId',
  authMiddleware,
  validateJobIdParamsMiddleware,
  generationController.getGenerationStatus.bind(generationController)
);
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
