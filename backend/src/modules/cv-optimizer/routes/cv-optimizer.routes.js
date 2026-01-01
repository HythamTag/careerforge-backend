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

// All optimization routes require authentication
// router.use(authMiddleware); // Uncomment when auth is ready

/**
 * @route POST /v1/optimize
 * @desc Optimize entire CV content
 * @access Private
 */
router.post('/', validateOptimizeCvMiddleware, cvOptimizerController.optimizeCV.bind(cvOptimizerController));

/**
 * @route POST /v1/optimize/sections
 * @desc Optimize specific CV sections
 * @access Private
 */
router.post('/sections', validateOptimizeSectionsMiddleware, cvOptimizerController.optimizeSections.bind(cvOptimizerController));

/**
 * @route POST /v1/optimize/tailor
 * @desc Tailor CV for specific job
 * @access Private
 */
router.post('/tailor', validateTailorForJobMiddleware, cvOptimizerController.tailorForJob.bind(cvOptimizerController));

/**
 * @route GET /v1/optimize/capabilities
 * @desc Get optimization capabilities
 * @access Public
 */
router.get('/capabilities', validateCapabilitiesQueryMiddleware, cvOptimizerController.getCapabilities.bind(cvOptimizerController));

module.exports = router;
