/**
 * CV ATS CONTROLLER
 *
 * Handles CV ATS analysis and optimization requests with job-based workflow.
 *
 * @module modules/cv-ats/controllers/cv-ats.controller
 */

const { logger, ResponseFormatter } = require('@utils');
const { HTTP_STATUS, ERROR_CODES, CV_ATS, PAGINATION } = require('@constants');
const { NotFoundError, ValidationError } = require('@errors');

class CvAtsController {
  /**
     * Create CV ATS controller with service injection.
     */
  constructor(cvAtsService) {
    this.service = cvAtsService;
  }

  /**
   * Start a new ATS analysis job
   * POST /v1/ats-analyses
   */
  async startAnalysis(req, res, next) {
    try {
      const analysisData = this._extractAnalysisData(req.body);

      const result = await this.service.startAnalysis(req.userId, analysisData);

      const { response, statusCode } = ResponseFormatter.success(result, {
        message: 'CV ATS analysis job started successfully',
        statusCode: HTTP_STATUS.ACCEPTED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract and normalize analysis data from request body
   * @private
   * @param {Object} body - Request body
   * @returns {Object} Normalized analysis data
   */
  _extractAnalysisData(body) {
    return {
      cvId: body.cvId,
      versionId: body.versionId,
      // Support legacy structure or root level
      type: body.type || body.options?.type,
      priority: body.priority || body.options?.priority,
      // Target job from root, legacy options, or constructed from legacy jobDescription
      targetJob: this._normalizeTargetJob(body.targetJob || body.options?.targetJob, body.jobDescription),
      parameters: body.parameters || body.options?.parameters || {},
    };
  }

  /**
   * Helper: Normalize target job data ensuring title exists
   */
  _normalizeTargetJob(targetJob, jobDescription) {
    if (targetJob) {
      return {
        ...targetJob,
        title: targetJob.title || 'Target Position', // Ensure title exists
        description: targetJob.description || jobDescription,
      };
    }

    return this._buildTargetJobFromDescription(jobDescription);
  }

  /**
   * Build target job object from simple description string (legacy support)
   * @private
   * @param {string} description - Job description
   * @returns {Object|undefined} Target job object or undefined
   */
  _buildTargetJobFromDescription(description) {
    if (!description) return undefined;

    return {
      title: 'Target Position',
      description: description,
    };
  }

  /**
     * Get ATS analysis job status
     * GET /v1/ats-analyses/:id
     */
  async getAnalysisStatus(req, res, next) {
    try {
      const { id: jobId } = req.params;
      const result = await this.service.getAnalysisStatus(jobId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Get ATS analysis result
     * GET /v1/ats-analyses/:id/result
     */
  async getAnalysisResult(req, res, next) {
    try {
      const { id: jobId } = req.params;
      const result = await this.service.getAnalysisResult(jobId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Cancel ATS analysis job
     * POST /v1/ats-analyses/:id/cancel
     */
  async cancelAnalysis(req, res, next) {
    try {
      const { id: jobId } = req.params;
      const result = await this.service.cancelAnalysis(jobId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
     * Get user's ATS analysis history
     * GET /v1/ats-analyses/history
     */
  async getAnalysisHistory(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : PAGINATION.DEFAULT_PAGE;
      const limitRaw = req.query.limit ? parseInt(req.query.limit, 10) : PAGINATION.DEFAULT_LIMIT;

      const options = {
        page: isNaN(page) ? PAGINATION.DEFAULT_PAGE : page,
        limit: Math.min(isNaN(limitRaw) ? PAGINATION.DEFAULT_LIMIT : limitRaw, CV_ATS.MAX_ANALYSIS_LIMIT),
        status: req.query.status,
        type: req.query.type,
        cvId: req.query.cvId,
        sort: req.query.sort,
      };

      const result = await this.service.getAnalysisHistory(req.userId, options);

      const { response, statusCode } = ResponseFormatter.paginated(result.data, result.pagination, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get ATS analysis history error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get ATS analysis statistics
     * GET /v1/ats-analyses/stats
     */
  async getAnalysisStats(req, res, next) {
    try {
      const result = await this.service.getAnalysisStats(req.userId);

      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get ATS analysis stats error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get ATS analysis trends
     * GET /v1/ats-analyses/trends
     */
  async getAnalysisTrends(req, res, next) {
    try {
      const timeframe = req.query.timeframe;
      const result = await this.service.getAnalysisTrends(req.userId, timeframe);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get ATS analysis trends error', { error: error.message, timeframe: req.query.timeframe, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get recent analyses with scores
     * GET /v1/ats-analyses/recent-scores
     */
  async getRecentAnalysesWithScores(req, res, next) {
    try {
      const limitRaw = req.query.limit ? parseInt(req.query.limit, 10) : PAGINATION.PARSING_HISTORY_LIMIT;
      const limit = isNaN(limitRaw) ? PAGINATION.PARSING_HISTORY_LIMIT : limitRaw;
      const result = await this.service.getRecentAnalysesWithScores(req.userId, limit);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get recent ATS analyses error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

}

module.exports = CvAtsController;