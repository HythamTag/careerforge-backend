/**
 * CV CONTROLLER
 *
 * Handles HTTP requests for CV operations including CRUD and management.
 *
 * @module modules/cvs/controllers/cv.controller
 */

const { HTTP_STATUS, PAGINATION, ERROR_CODES } = require('@constants');
const { logger, ResponseFormatter, pagination } = require('@utils');
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');

class CVController {
  /**
   * Create CV controller with dependency injection.
   */
  constructor(cvService, fileService, cvParsingService) {
    this.service = cvService;
    this.fileService = fileService;
    this.cvParsingService = cvParsingService;
  }

  /**
   * Create a new CV
   */
  async createCV(req, res, next) {
    try {
      const userId = req.userId;
      const cvData = {
        ...req.body,
        userId,
      };

      const cv = await this.service.createCV(cvData);

      const { response, statusCode } = ResponseFormatter.resource(cv, {
        links: {
          self: `/v1/cvs/${cv.id}`,
          update: `/v1/cvs/${cv.id}`,
          delete: `/v1/cvs/${cv.id}`,
          versions: `/v1/cvs/${cv.id}/versions`,
          publish: `/v1/cvs/${cv.id}/publish`,
        },
        statusCode: HTTP_STATUS.CREATED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Create CV', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Get user's CVs with pagination
   */
  async getUserCVs(req, res, next) {
    try {
      const userId = req.userId;
      const { page: sanitizedPage, limit: sanitizedLimit } = pagination.sanitize(
        req.query.page,
        req.query.limit,
        { defaultLimit: PAGINATION.PARSING_HISTORY_LIMIT }
      );

      const options = {
        page: sanitizedPage,
        limit: sanitizedLimit,
        status: req.query.status,
        search: req.query.search,
        sortBy: req.query.sortBy || 'updatedAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await this.service.getUserCVs(userId, options);

      const links = {
        self: `/v1/cvs?page=${options.page}&limit=${options.limit}`,
      };

      if (result.pagination.hasNext) {
        links.next = `/v1/cvs?page=${options.page + 1}&limit=${options.limit}`;
      }

      if (result.pagination.hasPrev) {
        links.prev = `/v1/cvs?page=${options.page - 1}&limit=${options.limit}`;
      }

      const { response, statusCode } = ResponseFormatter.paginated(result.cvs, result.pagination, {
        links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get user CVs', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Get CV by ID
   */
  async getCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;

      const cv = await this.service.getCVById(cvId, userId, { includeActiveVersion: true });
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      const { response, statusCode } = ResponseFormatter.resource(cv, {
        links: {
          self: `/v1/cvs/${cv.id}`,
          update: `/v1/cvs/${cv.id}`,
          delete: `/v1/cvs/${cv.id}`,
          versions: `/v1/cvs/${cv.id}/versions`,
          duplicate: `/v1/cvs/${cv.id}/duplicate`,
          export: `/v1/cvs/${cv.id}/export`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Get CV status (lightweight endpoint for polling)
   */
  async getCVStatus(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;

      const cv = await this.service.getCVById(cvId, userId, { includeActiveVersion: true });
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      // Return only status-related fields for efficient polling
      const statusData = {
        cvId: cv.id,
        status: cv.status,
        parsingStatus: cv.parsingStatus,
        isParsed: cv.isParsed,
        parsingProgress: cv.parsingProgress || 0,
        parsingStage: cv.metadata?.parsingStage || null,
        parsedAt: cv.parsedAt,
        failedAt: cv.failedAt,
        parsingError: cv.parsingError,
      };

      const { response, statusCode } = ResponseFormatter.resource(statusData);
      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV status', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Update CV
   */
  async updateCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;
      const updates = req.body;

      const cv = await this.service.updateCV(cvId, userId, updates);

      const { response, statusCode } = ResponseFormatter.resource(cv, {
        links: {
          self: `/v1/cvs/${cv.id}`,
          versions: `/v1/cvs/${cv.id}/versions`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Update CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Delete CV
   */
  async deleteCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;

      await this.service.deleteCV(cvId, userId);

      const { response, statusCode } = ResponseFormatter.success(null, {
        message: 'CV deleted successfully',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Delete CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Duplicate CV
   */
  async duplicateCV(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;
      const { title } = req.body;

      const duplicatedCV = await this.service.duplicateCV(cvId, userId, title);

      const { response, statusCode } = ResponseFormatter.resource(duplicatedCV, {
        links: {
          self: `/v1/cvs/${duplicatedCV.id}`,
          original: `/v1/cvs/${cvId}`,
        },
        statusCode: HTTP_STATUS.CREATED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Duplicate CV', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }



  /**
   * Search CVs
   */
  async searchCVs(req, res, next) {
    try {
      const userId = req.userId;
      const { q, tags, status, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;

      const result = await this.service.searchCVs(userId, {
        query: q,
        tags: tags ? tags.split(',') : [],
        status,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });

      const { response, statusCode } = ResponseFormatter.paginated(result.cvs, result.pagination, {
        meta: {
          query: q,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Search CVs', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Get CV statistics
   */
  async getCVStats(req, res, next) {
    try {
      const userId = req.userId;

      const stats = await this.service.getCVStats(userId);

      const { response, statusCode } = ResponseFormatter.success(stats);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV stats', error, { userId: req.userId });
      next(error);
    }
  }

  /**
   * Bulk operations on CVs
   */
  async bulkOperation(req, res, next) {
    try {
      const userId = req.userId;
      const { operation, cvIds, ...params } = req.body;

      const result = await this.service.bulkOperation(userId, operation, cvIds, params);

      const { response, statusCode } = ResponseFormatter.success(result, {
        meta: {
          operation,
          processed: cvIds.length,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Bulk CV operation', error, {
        userId: req.userId,
        operation: req.body.operation,
        count: req.body.cvIds?.length,
      });
      next(error);
    }
  }

  /**
   * Upload CV file and create CV 
   */
  async uploadCV(req, res, next) {
    try {
      const userId = req.userId;
      const file = req.file;

      const result = await this.service.createFromUpload(userId, file, req.body.title);

      const { response, statusCode } = ResponseFormatter.resource(result, {
        links: {
          self: `/v1/cvs/${result.cv.id}`,
          update: `/v1/cvs/${result.cv.id}`,
          delete: `/v1/cvs/${result.cv.id}`,
        },
        statusCode: HTTP_STATUS.ACCEPTED,
        message: 'CV uploaded and parsing started',
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Upload CV', error, { userId: req.userId });
      next(error);
    }
  }
}

module.exports = CVController;