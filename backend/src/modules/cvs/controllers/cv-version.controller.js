/**
 * CV VERSION CONTROLLER
 *
 * Handles HTTP requests for CV version operations.
 * Manages version creation, retrieval, and activation.
 *
 * @module modules/cvs/controllers/cv-version.controller
 */

const { HTTP_STATUS, ERROR_CODES, PAGINATION, CV_VERSION_NAMES } = require('@constants');
const { logger, ResponseFormatter } = require('@utils');
const { NotFoundError, ErrorFactory } = require('@errors');

class CVVersionController {
  /**
   * Create CV version controller with dependency injection.
   */
  constructor(cvVersionService, cvService) {
    this.cvVersionService = cvVersionService;
    this.cvService = cvService;
  }

  /**
   * Get all versions of a CV
   */
  async getCVVersions(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;
      const { page, limit } = req.query;

      const options = {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : PAGINATION.DEFAULT_LIMIT,
      };

      const result = await this.cvVersionService.getCVVersions(cvId, userId, options);

      const links = {
        self: `/v1/cvs/${cvId}/versions?page=${options.page}&limit=${result.pagination.limit}`,
        cv: `/v1/cvs/${cvId}`,
      };
      if (result.pagination.hasNext) {
        links.next = `/v1/cvs/${cvId}/versions?page=${options.page + 1}&limit=${result.pagination.limit}`;
      }
      if (result.pagination.hasPrev) {
        links.prev = `/v1/cvs/${cvId}/versions?page=${options.page - 1}&limit=${result.pagination.limit}`;
      }

      const { response, statusCode } = ResponseFormatter.paginated(result.versions, result.pagination, {
        links,
        itemLinks: (version) => ({
          self: `/v1/cvs/${cvId}/versions/${version.id}`,
          activate: `/v1/cvs/${cvId}/versions/${version.id}/activate`,
        }),
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV versions', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Create a new version of a CV
   */
  async createVersion(req, res, next) {
    try {
      const cvId = req.params.id;
      const userId = req.userId;
      const { name, content, description, changeType } = req.body;

      // Get current CV to use its content if not provided
      const cv = await this.cvService.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      const versionContent = content || cv.content;
      const versionName = name || CV_VERSION_NAMES.MANUAL_CREATION;
      const versionDescription = description || name;
      const versionChangeType = changeType || 'manual';

      const version = await this.cvVersionService.createVersion(
        cvId,
        userId,
        versionContent,
        versionName,
        versionDescription,
        versionChangeType
      );

      // Format response according to API documentation - wrap version in version object
      const { response, statusCode } = ResponseFormatter.resource({
        version: {
          id: version.id,
          name: version.name,
          version: version.versionNumber,
          description: version.description,
          createdAt: version.createdAt,
        },
      }, {
        links: {
          self: `/v1/cvs/${cvId}/versions/${version.id}`,
          cv: `/v1/cvs/${cvId}`,
          versions: `/v1/cvs/${cvId}/versions`,
        },
        statusCode: HTTP_STATUS.CREATED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Create CV version', error, { cvId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
   * Get a specific version of a CV
   */
  async getCVVersion(req, res, next) {
    try {
      const cvId = req.params.id;
      const versionId = req.params.versionId;
      const userId = req.userId;

      const version = await this.cvVersionService.getCVVersion(cvId, versionId, userId);

      // Format response according to API documentation - wrap version in version object
      const { response, statusCode } = ResponseFormatter.resource({
        version: {
          id: version.id,
          name: version.name,
          version: version.versionNumber,
          description: version.description,
          createdAt: version.createdAt,
          content: version.content,
        },
      }, {
        links: {
          self: `/v1/cvs/${cvId}/versions/${version.id}`,
          cv: `/v1/cvs/${cvId}`,
          versions: `/v1/cvs/${cvId}/versions`,
          activate: `/v1/cvs/${cvId}/versions/${version.id}/activate`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Get CV version', error, {
        cvId: req.params.id,
        versionId: req.params.versionId,
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
   * Activate/restore a specific version of a CV
   */
  async activateVersion(req, res, next) {
    try {
      const cvId = req.params.id;
      const versionId = req.params.versionId;
      const userId = req.userId;
      const { name, description } = req.body;

      const result = await this.cvVersionService.activateVersion(cvId, versionId, userId, name, description);

      // Format response according to API documentation - wrap version in version object
      const { response, statusCode } = ResponseFormatter.resource({
        version: {
          id: result.version.id,
          name: name || `Reverted from version ${result.version.versionNumber}`,
          version: result.version.versionNumber,
          description: description || `Content restored from version ${result.version.versionNumber}`,
        },
      }, {
        message: 'Version activated successfully',
        links: {
          self: `/v1/cvs/${cvId}/versions/${result.version.id}`,
          cv: `/v1/cvs/${cvId}`,
          versions: `/v1/cvs/${cvId}/versions`,
        },
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.logOperationError('Activate CV version', error, {
        cvId: req.params.id,
        versionId: req.params.versionId,
        userId: req.userId,
      });
      next(error);
    }
  }
}

module.exports = CVVersionController;

