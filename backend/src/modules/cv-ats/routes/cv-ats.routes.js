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
// Start ATS analysis job
/**
 * @openapi
 * /v1/ats-analyses:
 *   post:
 *     tags:
 *       - CV ATS
 *     summary: Start CV ATS analysis
 *     description: Starts a new ATS analysis job for a CV against a specific job description.
 *     operationId: startAtsAnalysis
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
 *               cvId: { type: 'string' }
 *               type: { type: 'string', enum: [compatibility, comprehensive] }
 *               targetJob:
 *                 type: object
 *                 properties:
 *                   description: { type: 'string' }
 *                   title: { type: 'string' }
 *     responses:
 *       202:
 *         description: Analysis job started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data: { $ref: '#/components/schemas/Job' }
 *       400:
 *         description: Invalid input
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: CV not found
 *         $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, validateStartCvAtsAnalysisMiddleware, cvAtsController.startAnalysis.bind(cvAtsController));

// History, statistics, and trends
// specific routes must come BEFORE generic /:jobId routes
/**
 * @openapi
 * /v1/ats-analyses/history:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get ATS analysis history
 *     operationId: getAtsAnalysisHistory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AtsAnalysis' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/history', authMiddleware, validateHistoryQueryMiddleware, cvAtsController.getAnalysisHistory.bind(cvAtsController));

/**
 * @openapi
 * /v1/ats-analyses/stats:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get overall ATS statistics
 *     operationId: getAtsAnalysisStats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/stats', authMiddleware, cvAtsController.getAnalysisStats.bind(cvAtsController));

/**
 * @openapi
 * /v1/ats-analyses/trends:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get ATS scoring trends
 *     operationId: getAtsAnalysisTrends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trends returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/trends', authMiddleware, validateTrendsQueryMiddleware, cvAtsController.getAnalysisTrends.bind(cvAtsController));

/**
 * @openapi
 * /v1/ats-analyses/recent-scores:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get recent ATS scores
 *     operationId: getRecentAtsScores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent scores returned
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/recent-scores', authMiddleware, cvAtsController.getRecentAnalysesWithScores.bind(cvAtsController));

// Get ATS analysis job status
/**
 * @openapi
 * /v1/ats-analyses/{id}:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get analysis job status
 *     operationId: getAtsAnalysisStatus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
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
router.get('/:id', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisStatus.bind(cvAtsController));

// Get ATS analysis result
/**
 * @openapi
 * /v1/ats-analyses/{id}/result:
 *   get:
 *     tags:
 *       - CV ATS
 *     summary: Get analysis result
 *     operationId: getAtsAnalysisResult
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
 *       404:
 *         description: Result or Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:id/result', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.getAnalysisResult.bind(cvAtsController));

// Cancel ATS analysis job
/**
 * @openapi
 * /v1/ats-analyses/{id}/cancel:
 *   post:
 *     tags:
 *       - CV ATS
 *     summary: Cancel analysis job
 *     operationId: cancelAtsAnalysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Job cancelled
 *       404:
 *         description: Job not found
 *         $ref: '#/components/schemas/Error'
 */
router.post('/:id/cancel', authMiddleware, validateJobIdParamsMiddleware, cvAtsController.cancelAnalysis.bind(cvAtsController));

module.exports = router;


