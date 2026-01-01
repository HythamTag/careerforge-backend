/**
 * JOB ROUTES
 *
 * Route definitions for job management operations.
 *
 * @module modules/jobs/routes/job.routes
 */
const express = require('express');
const router = express.Router();
const { resolve } = require('@core/container');
const { authMiddleware } = require('@middleware');
const {
  validateJobIdParamsMiddleware,
  validateGetJobLogsQueryMiddleware,
  validateGetUserJobsQueryMiddleware,
} = require('../validators/job.validator');

// Initialize controller with service from container
const JobController = require('../controllers/job.controller');
const jobService = resolve('jobService');
const jobController = new JobController(jobService);

// Job listing and statistics (must come before parameterized routes)
/**
 * @openapi
 * /v1/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: List background jobs
 *     description: Returns a list of background jobs for the authenticated user, filtered by status or type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: 'string' }
 *       - in: query
 *         name: type
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 */
router.get('/', authMiddleware, validateGetUserJobsQueryMiddleware, jobController.getUserJobs.bind(jobController));

/**
 * @openapi
 * /v1/jobs/stats:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get overall job statistics
 *     description: Returns detailed statistics including status breakdown, type distribution, success rate, and 7-day timeline.
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean', example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total: { type: 'integer' }
 *                         completed: { type: 'integer' }
 *                         failed: { type: 'integer' }
 *                         processing: { type: 'integer' }
 *                     byType:
 *                       type: object
 *                       additionalProperties: { type: 'integer' }
 *                     successRate: { type: 'number' }
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: 'string' }
 *                           count: { type: 'integer' }
 */
router.get('/stats', authMiddleware, jobController.getJobStats.bind(jobController));

// Individual job operations
/**
 * @openapi
 * /v1/jobs/{id}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get job details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: 'boolean' }
 *                 data: { $ref: '#/components/schemas/Job' }
 */
router.get('/:id', authMiddleware, validateJobIdParamsMiddleware, jobController.getJob.bind(jobController));

/**
 * @openapi
 * /v1/jobs/{id}/logs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get job execution logs
 */
router.get('/:id/logs', authMiddleware, validateJobIdParamsMiddleware, validateGetJobLogsQueryMiddleware, jobController.getJobLogs.bind(jobController));

/**
 * @openapi
 * /v1/jobs/{id}:
 *   delete:
 *     tags:
 *       - Jobs
 *     summary: Cancel a pending/processing job
 */
router.delete('/:id', authMiddleware, validateJobIdParamsMiddleware, jobController.cancelJob.bind(jobController));

/**
 * @openapi
 * /v1/jobs/{id}/retry:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Retry a failed job
 */
router.post('/:id/retry', authMiddleware, validateJobIdParamsMiddleware, jobController.retryJob.bind(jobController));

module.exports = router;

