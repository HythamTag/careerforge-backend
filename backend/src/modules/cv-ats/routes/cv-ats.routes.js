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
/**
 * @openapi
 * /v1/cv-ats:
 *   post:
 *     tags:
 *       - CV ATS
 *     summary: Start CV ATS analysis
 *     description: Starts a new ATS analysis job for a CV against a specific job description.
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
 *               - jobDescription
 *             properties:
 *               cvId: { type: 'string' }
 *               jobDescription: { type: 'string' }
 *     responses:
 *       202:
 *         description: Analysis job started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId: { type: 'string' }
 */
router.post('/', authMiddleware, validateStartCvAtsAnalysisMiddleware, cvAtsController.startAnalysis.bind(cvAtsController));

// History, statistics, and trends
// specific routes must come BEFORE generic /:jobId routes
/**
 * @openapi
 * /v1/cv-ats/history:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get ATS analysis history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History retrieved successfully
 */
router.get('/history', authMiddleware, validateHistoryQueryMiddleware, cvAtsController.getAnalysisHistory.bind(cvAtsController));

/**
 * @openapi
 * /v1/cv-ats/stats:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get overall ATS statistics
 */
router.get('/stats', authMiddleware, cvAtsController.getAnalysisStats.bind(cvAtsController));

/**
 * @openapi
 * /v1/cv-ats/trends:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get ATS scoring trends
 */
router.get('/trends', authMiddleware, validateTrendsQueryMiddleware, cvAtsController.getAnalysisTrends.bind(cvAtsController));

/**
 * @openapi
 * /v1/cv-ats/recent-scores:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get recent ATS scores
 */
router.get('/recent-scores', authMiddleware, cvAtsController.getRecentAnalysesWithScores.bind(cvAtsController));

// Get ATS analysis job status
/**
 * @openapi
 * /v1/cv-ats/{id}:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get analysis job status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 */
router.get('/:id', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisStatus.bind(cvAtsController));

// Get ATS analysis result
/**
 * @openapi
 * /v1/cv-ats/{id}/result:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get analysis result
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Result retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data: { $ref: '#/components/schemas/AtsAnalysis' }
 */
router.get('/:id/result', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisResult.bind(cvAtsController));

// Cancel ATS analysis job
/**
 * @openapi
 * /v1/cv-ats/{id}/cancel:
 *   post:
 *     tags:
 *       - CV ATS
 *     summary: Cancel analysis job
 */
router.post('/:id/cancel', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.cancelAnalysis.bind(cvAtsController));

module.exports = router;

