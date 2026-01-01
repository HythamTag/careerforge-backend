/**
 * CV ATS ROUTES
 *
 * Route definitions for CV ATS analysis with job-based workflow.
 *
 * @module modules/cv-ats/routes/cv-ats.routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('@middleware');
const {
  validateStartCvAtsAnalysisMiddleware,
  validateHistoryQueryMiddleware,
  validateTrendsQueryMiddleware,
} = require('../validators/cv-ats.validator');
const { validateJobIdParamsMiddleware } = require('@modules/jobs/validators/job.validator');

const { resolve } = require('@core/container');
const CvAtsService = resolve('cvAtsService');
const CvAtsController = require('../controllers/cv-ats.controller');
const cvAtsController = new CvAtsController(CvAtsService);

// Start ATS analysis job
router.post('/', authMiddleware, validateStartCvAtsAnalysisMiddleware, cvAtsController.startAnalysis.bind(cvAtsController));

// History, statistics, and trends
// specific routes must come BEFORE generic /:jobId routes
router.get('/history', authMiddleware, validateHistoryQueryMiddleware, cvAtsController.getAnalysisHistory.bind(cvAtsController));
router.get('/stats', authMiddleware, cvAtsController.getAnalysisStats.bind(cvAtsController));
router.get('/trends', authMiddleware, validateTrendsQueryMiddleware, cvAtsController.getAnalysisTrends.bind(cvAtsController));
router.get('/recent-scores', authMiddleware, cvAtsController.getRecentAnalysesWithScores.bind(cvAtsController));

// Get ATS analysis job status
router.get('/:id', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisStatus.bind(cvAtsController));

// Get ATS analysis result
router.get('/:id/result', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisResult.bind(cvAtsController));

// Cancel ATS analysis job
router.post('/:id/cancel', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.cancelAnalysis.bind(cvAtsController));

module.exports = router;

