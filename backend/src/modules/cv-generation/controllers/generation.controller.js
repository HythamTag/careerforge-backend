// ============================================================================
// FILE: modules/cv-generation/controllers/generation.controller.js
// ============================================================================

/**
 * GENERATION CONTROLLER
 *
 * HTTP request handlers for CV generation.
 * Simplified - all errors handled by global error handler.
 */

const { logger, ResponseFormatter } = require('@utils');
const { HTTP_STATUS, PAGINATION } = require('@constants');

class GenerationController {
  constructor(generationService) {
    this.service = generationService;
  }

  /**
   * Start a new CV generation job
   * POST /v1/pdf-generations
   */
  async startGeneration(req, res, next) {
    try {
      const generationData = this._extractGenerationData(req);
      const result = await this.service.startGeneration(req.userId, generationData);

      const { response, statusCode } = ResponseFormatter.success(result, {
        message: 'CV generation job started successfully',
        statusCode: HTTP_STATUS.ACCEPTED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get generation job status
   * GET /v1/pdf-generations/:jobId
   */
  async getGenerationStatus(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await this.service.getGenerationStatus(jobId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download generated CV
   * GET /v1/pdf-generations/:jobId/download
   */
  async downloadGeneration(req, res, next) {
    try {
      const { jobId } = req.params;

      // Service returns standardized download object
      const download = await this.service.prepareDownload(jobId, req.userId);

      res.setHeader('Content-Type', download.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${download.fileName}"`);
      res.setHeader('Content-Length', download.size);
      res.send(download.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel generation job
   * POST /v1/pdf-generations/:jobId/cancel
   */
  async cancelGeneration(req, res, next) {
    try {
      const { jobId } = req.params;
      const result = await this.service.cancelGeneration(jobId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's generation history
   * GET /v1/pdf-generations/history
   */
  async getGenerationHistory(req, res, next) {
    try {
      const options = this._parseHistoryOptions(req.query);
      const result = await this.service.getGenerationHistory(req.userId, options);

      const { response, statusCode } = ResponseFormatter.paginated(
        result.data,
        result.pagination,
        { links: result._links }
      );

      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get generation statistics
   * GET /v1/pdf-generations/stats
   */
  async getGenerationStats(req, res, next) {
    try {
      const result = await this.service.getGenerationStats(req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview generation
   * POST /v1/pdf-generations/preview
   */
  async previewGeneration(req, res, next) {
    try {
      const previewData = {
        cvId: req.body.cvId || req.body.resumeId,
        versionId: req.body.versionId,
        templateId: req.body.templateId,
        parameters: req.body.parameters,
      };

      const result = await this.service.previewGeneration(req.userId, previewData);

      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /*
   * Helper: Extract generation data from request
   */
  _extractGenerationData(req) {
    return {
      cvId: req.body.cvId || req.body.resumeId,
      versionId: req.body.versionId,
      templateId: req.body.templateId,
      outputFormat: req.body.outputFormat || req.body.format,
      type: req.body.type,
      parameters: req.body.parameters,
      inputData: req.body.inputData,
    };
  }

  /**
   * Helper: Parse history query options
   */
  _parseHistoryOptions(query) {
    // Handle comma-separated status values
    let status = query.status;
    if (status && status.includes(',')) {
      status = status.split(',').map(s => s.trim()).filter(s => s);
    }

    return {
      page: parseInt(query.page, 10) || 1,
      limit: Math.min(
        parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT,
        PAGINATION.MAX_GENERATION_LIMIT
      ),
      status,
      type: query.type,
      format: query.format,
      cvId: query.cvId || query.resumeId,
      sort: query.sort,
    };
  }
}

module.exports = GenerationController;
