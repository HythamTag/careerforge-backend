/**
 * CV PARSING CONTROLLER
 *
 * Handles HTTP requests for CV parsing operations.
 * Manages parsing jobs, status tracking, and result retrieval.
 *
 * @module modules/cv-parsing/controllers/cv-parsing.controller
 */

const { HTTP_STATUS, RESPONSE_MESSAGES, PAGINATION, ERROR_CODES, JOB_STATUS } = require('@constants');
const { logger, ResponseFormatter, pagination, requireOwnership } = require('@utils');
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');

class CVParsingController {
  /**
   * Create CV parsing controller with dependency injection.
   */
  constructor(cvParsingService, cvParsingRepository) {
    this.service = cvParsingService;
    this.cvParsingRepository = cvParsingRepository;
  }

  /**
   * Start a CV parsing job
   */
  async startParsing(req, res, next) {
    try {
      const userId = req.userId;
      const { cvId, parsingOptions } = req.body;

      const job = await this.service.startParsing(userId, cvId, parsingOptions);

      const { response, statusCode } = ResponseFormatter.success({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
      }, {
        message: RESPONSE_MESSAGES.CV_PARSING_STARTED,
        links: {
          status: `/v1/parse/${job.jobId}`,
          result: `/v1/parse/${job.jobId}/result`,
        },
        statusCode: HTTP_STATUS.ACCEPTED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Start parsing error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
   * Get parsing job status
   */
  async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const userId = req.userId;

      const job = await this.cvParsingRepository.findJobById(jobId);
      if (!job) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }
      if (job.userId) {
        // Handle populated userId
        const resourceUserId = job.userId._id || job.userId;
        requireOwnership(resourceUserId, userId, 'parsing job', ERROR_CODES.FORBIDDEN);
      }

      const { response, statusCode } = ResponseFormatter.success({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      }, {
        links: {
          result: job.status === JOB_STATUS.COMPLETED ? `/v1/parse/${jobId}/result` : null,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get job status error', { error: error.message, jobId: req.params.jobId });
      next(error);
    }
  }

  /**
   * Get parsing job result
   */
  async getJobResult(req, res, next) {
    try {
      const { jobId } = req.params;
      const userId = req.userId;

      const job = await this.cvParsingRepository.findJobById(jobId);
      if (!job) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }
      if (job.userId) {
        // Handle populated userId
        const resourceUserId = job.userId._id || job.userId;
        requireOwnership(resourceUserId, userId, 'parsing job', ERROR_CODES.FORBIDDEN);
      }

      if (job.status !== JOB_STATUS.COMPLETED) {
        throw ErrorFactory.validationFailed('Parsing job is not completed yet', ERROR_CODES.JOB_NOT_COMPLETED);
      }

      const { response, statusCode } = ResponseFormatter.success({
        jobId: job.jobId,
        result: job.result,
        metadata: job.metadata,
        completedAt: job.metadata.processingEndTime,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get job result error', { error: error.message, jobId: req.params.jobId });
      next(error);
    }
  }

  /**
   * Cancel parsing job
   */
  async cancelJob(req, res, next) {
    try {
      const { jobId } = req.params;
      const userId = req.userId;

      await this.service.cancelJob(jobId, userId);

      const { response, statusCode } = ResponseFormatter.success(null, {
        message: 'Parsing job cancelled successfully',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Cancel job error', { error: error.message, jobId: req.params.jobId });
      next(error);
    }
  }

  /**
   * Get user's parsing history
   */
  async getParsingHistory(req, res, next) {
    try {
      const userId = req.userId;
      const {
        page: sanitizedPage,
        limit: sanitizedLimit
      } = pagination.sanitize(
        req.query.page,
        req.query.limit,
        { defaultLimit: PAGINATION.PARSING_HISTORY_LIMIT }
      );

      const options = {
        page: sanitizedPage,
        limit: sanitizedLimit,
        status: req.query.status,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await this.cvParsingRepository.getUserJobs(userId, options);

      const { response, statusCode } = ResponseFormatter.paginated(
        result.jobs,
        result.pagination,
        {
          message: 'CV parsing history retrieved successfully',
        }
      );

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get parsing history error', {
        error: error.message,
        userId: req.userId
      });
      next(error);
    }
  }

  /**
   * Get parsing statistics
   */
  async getParsingStats(req, res, next) {
    try {
      const userId = req.userId;

      const stats = await this.cvParsingRepository.getUserStats(userId);

      const { response, statusCode } = ResponseFormatter.success(stats, {
        message: 'CV parsing statistics retrieved successfully',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get parsing stats error', {
        error: error.message,
        userId: req.userId
      });
      next(error);
    }
  }

  /**
   * Get supported file formats
   */
  async getSupportedFormats(req, res, next) {
    try {
      const formats = await this.service.getSupportedFormats();

      const { response, statusCode } = ResponseFormatter.success({
        formats,
        count: formats.length,
      }, {
        message: 'Supported file formats retrieved successfully',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get supported formats error', {
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Retry a failed parsing job
   */
  async retryJob(req, res, next) {
    try {
      const { jobId } = req.params;
      const userId = req.userId;

      const job = await this.service.retryFailedJob(jobId, userId);

      const { response, statusCode } = ResponseFormatter.success({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
      }, {
        message: 'Parsing job retry started',
        statusCode: HTTP_STATUS.ACCEPTED,
        links: {
          status: `/v1/parse/${job.jobId}`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Retry job error', {
        error: error.message,
        jobId: req.params.jobId,
        userId: req.userId,
      });
      next(error);
    }
  }
}

module.exports = CVParsingController;