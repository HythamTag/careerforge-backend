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
router.get('/', authMiddleware, validateGetUserJobsQueryMiddleware, jobController.getUserJobs.bind(jobController));
router.get('/stats', authMiddleware, jobController.getJobStats.bind(jobController));

// Individual job operations
router.get('/:id', authMiddleware, validateJobIdParamsMiddleware, jobController.getJob.bind(jobController));
router.get('/:id/logs', authMiddleware, validateJobIdParamsMiddleware, validateGetJobLogsQueryMiddleware, jobController.getJobLogs.bind(jobController));
router.delete('/:id', authMiddleware, validateJobIdParamsMiddleware, jobController.cancelJob.bind(jobController));
router.post('/:id/retry', authMiddleware, validateJobIdParamsMiddleware, jobController.retryJob.bind(jobController));


module.exports = router;

