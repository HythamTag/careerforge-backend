/**
 * JOB CONTROLLER
 *
 * HTTP request handlers for job management operations.
 *
 * @module modules/jobs/controllers/job.controller
 */

// ==========================================
// CORE MODULES
// ==========================================
const { JOB_STATUS, ERROR_CODES } = require('@constants');
const { ResponseFormatter } = require('@utils');
const { NotFoundError, ValidationError, ForbiddenError } = require('@errors');
const { requireOwnership } = require('@utils');

class JobController {
  constructor(jobService) {
    this.service = jobService;
  }

  /**
     * Get job by ID
     */
  async getJob(req, res, next) {
    try {
      const { id } = req.params;
      const job = await this.service.getJob(id);

      // Check if user owns this job
      if (job.userId) {
        requireOwnership(job.userId, req.userId, 'job', ERROR_CODES.FORBIDDEN);
      }

      const { response, statusCode } = ResponseFormatter.success(job);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ForbiddenError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      next(error);
    }
  }

  /**
     * Get user's jobs
     */
  async getUserJobs(req, res, next) {
    try {
      // Query parameters are already validated by middleware
      const filters = {
        status: req.query.status,
        type: req.query.type,
        sort: req.query.sort,
        limit: req.query.limit,
        skip: req.query.skip,
      };

      const jobs = await this.service.getUserJobs(req.userId, filters);

      const pagination = {
        limit: filters.limit,
        skip: filters.skip,
        total: jobs.length,
        hasMore: jobs.length === filters.limit,
      };

      const { response, statusCode } = ResponseFormatter.paginated(jobs, pagination);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Get all jobs (admin only)
     */
  async getAllJobs(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type,
        sort: req.query.sort,
        limit: parseInt(req.query.limit, 10),
        skip: parseInt(req.query.skip, 10),
      };

      // In a real app, you'd check for admin role
      const jobs = await this.service.getUserJobs(null, filters);

      const pagination = {
        limit: filters.limit,
        skip: filters.skip,
        total: jobs.length,
        hasMore: jobs.length === filters.limit,
      };

      const { response, statusCode } = ResponseFormatter.paginated(jobs, pagination);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Cancel job
     */
  async cancelJob(req, res, next) {
    try {
      const { id } = req.params;
      const reason = req.body.reason;

      const job = await this.service.getJob(id);

      // Check if user owns this job
      if (job.userId) {
        requireOwnership(job.userId, req.userId, 'job', ERROR_CODES.FORBIDDEN);
      }

      const updatedJob = await this.service.cancelJob(id, reason);

      const { response, statusCode } = ResponseFormatter.success(updatedJob);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ForbiddenError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      next(error);
    }
  }

  /**
     * Retry failed job
     */
  async retryJob(req, res, next) {
    try {
      const { id } = req.params;

      const job = await this.service.getJob(id);

      // Check if user owns this job
      if (job.userId) {
        requireOwnership(job.userId, req.userId, 'job', ERROR_CODES.FORBIDDEN);
      }

      const updatedJob = await this.service.retryJob(id);

      const { response, statusCode } = ResponseFormatter.success(updatedJob);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ForbiddenError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      next(error);
    }
  }

  /**
     * Get job statistics
     */
  async getJobStats(req, res, next) {
    try {
      // For user's own stats
      const stats = await this.service.getJobStats(req.userId);

      const { response, statusCode } = ResponseFormatter.success(stats);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Get job logs (if available)
     */
  async getJobLogs(req, res, next) {
    try {
      const { id } = req.params;

      const job = await this.service.getJob(id);

      // Check if user owns this job
      if (job.userId) {
        requireOwnership(job.userId, req.userId, 'job', ERROR_CODES.FORBIDDEN);
      }

      // In a real implementation, you'd fetch logs from a logging service
      const logs = [
        {
          timestamp: job.createdAt,
          level: 'info',
          message: `Job ${job.jobId} created`,
        },
      ];

      if (job.startedAt) {
        logs.push({
          timestamp: job.startedAt,
          level: 'info',
          message: `Job ${job.jobId} started processing`,
        });
      }

      if (job.completedAt) {
        const level = job.status === JOB_STATUS.COMPLETED ? 'info' : 'error';
        logs.push({
          timestamp: job.completedAt,
          level,
          message: `Job ${job.jobId} ${job.status}`,
          details: job.error || job.result,
        });
      }

      const { response, statusCode } = ResponseFormatter.success({
        jobId: job.jobId,
        logs,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

}

module.exports = JobController;

