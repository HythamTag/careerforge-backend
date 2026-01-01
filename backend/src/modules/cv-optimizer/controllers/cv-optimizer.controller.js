/**
 * CV OPTIMIZER CONTROLLER
 *
 * Direct CV optimization without job orchestration.
 * Provides immediate optimization results via API.
 *
 * @module modules/cv-optimizer/controllers/cv-optimizer.controller
 */

const logger = require('@utils/logger');
const { ERROR_CODES } = require('@constants');
const { ValidationError } = require('@errors');
const { ResponseFormatter } = require('@utils');

const { CV_VERSION_NAMES, CV_VERSION_DESCRIPTIONS, CV_VERSION_CHANGE_TYPE, CV_STATUS } = require('@constants');

class CVOptimizerController {
  constructor(cvOptimizerService, cvVersionService, cvService) {
    this.service = cvOptimizerService;
    this.cvVersionService = cvVersionService;
    this.cvService = cvService;
  }

  /**
     * Optimize CV content
     */
  async optimizeCV(req, res, next) {
    try {
      const { cvData, options = {} } = req.body;

      if (!cvData) {
        throw new ValidationError('CV data is required', ERROR_CODES.VALIDATION_ERROR);
      }

      logger.info('Starting CV optimization', {
        userId: req.userId,
        options: Object.keys(options),
      });

      const optimizedCV = await this.service.optimizeContent(cvData, options);

      const { response, statusCode } = ResponseFormatter.success({
        original: cvData,
        optimized: optimizedCV,
      });

      res.status(statusCode).json(response);

    } catch (error) {
      logger.logOperationError('CV optimization', error, { userId: req.userId });
      next(error);
    }
  }

  /**
     * Optimize specific CV sections
     */
  async optimizeSections(req, res, next) {
    try {
      const { cvData, sections, options = {} } = req.body;

      if (!cvData || !sections || !Array.isArray(sections)) {
        throw new ValidationError('CV data and sections array are required', ERROR_CODES.VALIDATION_ERROR);
      }

      logger.info('Starting section optimization', {
        userId: req.userId,
        sections: sections.length,
      });

      const optimizedCV = await this.service.optimizeSections(cvData, sections, options);

      const { response, statusCode } = ResponseFormatter.success({
        sections: sections,
        optimized: optimizedCV,
      });

      res.status(statusCode).json(response);

    } catch (error) {
      logger.logOperationError('Section optimization', error, { userId: req.userId });
      next(error);
    }
  }

  /**
     * Tailor CV for specific job
     */
  async tailorForJob(req, res, next) {
    try {
      const { cvData, jobData, options = {}, cvId } = req.body;

      if (!cvData || !jobData) {
        throw new ValidationError('CV data and job data are required', ERROR_CODES.VALIDATION_ERROR);
      }

      logger.info('Starting job tailoring', {
        userId: req.userId,
        cvId,
        jobTitle: jobData.title,
      });

      const tailoredCV = await this.service.tailorForJob(cvData, jobData, options);

      // If cvId is provided, save as a new version and update CV status
      let versionInfo = null;
      if (cvId && this.cvVersionService) {
        try {
          const versionName = `Tailored for ${jobData.title}`;
          const versionDesc = `AI-powered optimization for ${jobData.title} at ${jobData.company || 'specified company'}`;

          const version = await this.cvVersionService.createVersion(
            cvId,
            req.userId,
            tailoredCV,
            versionName,
            versionDesc,
            CV_VERSION_CHANGE_TYPE.AI_OPTIMIZED
          );

          versionInfo = {
            id: version.id,
            versionNumber: version.versionNumber
          };

          // Update main CV status to optimized
          if (this.cvService) {
            await this.cvService.updateCV(cvId, req.userId, {
              status: CV_STATUS.OPTIMIZED,
              parsingStatus: CV_STATUS.OPTIMIZED, // Also update parsingStatus for the Status tab
              parsingProgress: 100
            });
          }
        } catch (saveError) {
          logger.warn('Failed to save tailored version or update status', {
            error: saveError.message,
            cvId,
            userId: req.userId
          });
          // Don't fail the whole request if just saving version fails
        }
      }

      const { response, statusCode } = ResponseFormatter.success({
        job: {
          title: jobData.title,
          company: jobData.company,
        },
        tailored: tailoredCV,
        version: versionInfo
      });

      res.status(statusCode).json(response);

    } catch (error) {
      logger.logOperationError('Job tailoring', error, { userId: req.userId });
      next(error);
    }
  }

  /**
     * Get optimization capabilities
     */
  async getCapabilities(req, res, next) {
    try {
      const capabilities = this.service.getCapabilities();

      const { response, statusCode } = ResponseFormatter.success(capabilities);

      res.status(statusCode).json(response);

    } catch (error) {
      logger.logOperationError('Get capabilities', error);
      next(error);
    }
  }
}

module.exports = CVOptimizerController;

