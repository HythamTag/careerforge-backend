const logger = require('@utils/logger');
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');
const {
  ERROR_CODES,
  JOB_TYPE,
  JOB_PRIORITY,
  JOB_PRIORITY_NAMES,
  JOB_STATUS,
  NUMERIC_LIMITS,
  OUTPUT_FORMAT,
  JOB_LIMITS,
  CV_ENTITY_STATUS,
  CV_STATUS,
  CV_VERSION_NAMES,
  CV_VERSION_DESCRIPTIONS,
  CV_VERSION_CHANGE_TYPE,
} = require('@constants');
const { requireOwnership } = require('@utils');
const JobIdGenerator = require('@modules/jobs/services/job-id.generator');
const transactionManager = require('@infrastructure/transaction.manager');
const CVProcessingLogger = require('@messaging/workers/processors/CVProcessingLogger');

class CVParsingService {
  /**
   * Create CV parsing service with dependency injection
   * 
   * @param {CVParsingRepository} cvParsingRepository
   * @param {JobService} jobService
   * @param {CVRepository} cvRepository
   * @param {FileService} fileService
   * @param {AIContentParserService} aiContentParserService
   * @param {ParserStrategyRegistry} parserStrategyRegistry
   */
  constructor(
    cvParsingRepository,
    jobService,
    cvRepository,
    fileService,
    aiContentParserService,
    parserStrategyRegistry,
    cvVersionRepository
  ) {
    this.cvParsingRepository = cvParsingRepository;
    this.jobService = jobService;
    this.cvRepository = cvRepository;
    this.fileService = fileService;
    this.aiContentParserService = aiContentParserService;
    this.parserStrategyRegistry = parserStrategyRegistry;
    this.cvVersionRepository = cvVersionRepository;
    this.idGenerator = new JobIdGenerator();
  }

  /**
   * Extract file type from mime type or filename
   * 
   * @private
   * @param {string} mimeType - MIME type
   * @param {string} filename - Filename
   * @returns {string} File type (pdf, docx, or doc)
   */
  _getFileType(mimeType, filename) {
    // Check MIME type first
    if (mimeType) {
      if (mimeType === 'application/pdf') {
        return OUTPUT_FORMAT.PDF;
      }
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return OUTPUT_FORMAT.DOCX;
      }
      if (mimeType === 'application/msword') {
        return 'doc';
      }
    }

    // Fallback to file extension
    if (filename) {
      const ext = filename.toLowerCase().split('.').pop();
      if (ext === 'pdf') return OUTPUT_FORMAT.PDF;
      if (ext === 'docx') return OUTPUT_FORMAT.DOCX;
      if (ext === 'doc') return 'doc';
    }

    // Default to PDF
    return OUTPUT_FORMAT.PDF;
  }

  async _updateParsingProgress(cvId, userId, progress, stage) {
    try {
      logger.debug('Updating parsing progress', { cvId, userId, progress, stage });
      await this.cvRepository.updateById(cvId, {
        parsingProgress: progress,
        parsingStatus: CV_STATUS.PROCESSING,
        'metadata.parsingStage': stage,
      });

      // Also update the job progress for real-time tracking
      // Job ID is required for this, so we only call it if we have it
    } catch (error) {
      logger.warn('Failed to update parsing progress', { cvId, progress, error: error.message });
    }
  }

  /**
   * Update job progress
   * @private
   */
  async _updateJobProgress(jobId, progress, stage) {
    try {
      if (jobId) {
        await this.jobService.updateJobProgress(jobId, progress, stage);
      }
    } catch (error) {
      logger.warn('Failed to update job progress', { jobId, progress, error: error.message });
    }
  }

  /**
   * Validate parsing options
   * 
   * @private
   * @param {Object} options - Parsing options
   * @throws {ValidationError} If options are invalid
   */
  _validateParsingOptions(options) {
    if (!options) return;

    const validOptions = [
      'extractSkills',
      'extractExperience',
      'extractEducation',
      'extractProjects',
      'extractCertifications',
      'extractLanguages',
      'extractPublications',
    ];

    for (const key of Object.keys(options)) {
      if (!validOptions.includes(key)) {
        throw ErrorFactory.validationFailed(
          `Invalid parsing option: ${key}`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      if (typeof options[key] !== 'boolean') {
        throw ErrorFactory.validationFailed(
          `Parsing option ${key} must be a boolean`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }
  }

  /**
   * Check if user has reached concurrent job limit
   * 
   * @private
   * @param {string} userId - User ID
   * @throws {ValidationError} If limit reached
   */
  async _checkConcurrentJobLimit(userId) {
    const activeJobCount = await this.cvParsingRepository.countActiveJobs(userId);

    if (activeJobCount >= JOB_LIMITS.MAX_CONCURRENT_PARSING_JOBS) {
      throw ErrorFactory.validationFailed(
        `Maximum concurrent parsing jobs limit reached (${JOB_LIMITS.MAX_CONCURRENT_PARSING_JOBS})`,
        ERROR_CODES.JOB_LIMIT_REACHED
      );
    }
  }

  /**
   * Start a CV parsing job
   *
   * @param {string} userId - User ID
   * @param {string} cvId - CV ID
   * @param {Object} options - Parsing options
   * @returns {Promise<Object>} Created job
   */
  async startParsing(userId, cvId, options = {}) {
    try {
      // Validate CV exists and belongs to user
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      // Validate parsing options
      if (options.parsingOptions) {
        this._validateParsingOptions(options.parsingOptions);
      }

      // Check concurrent job limit
      await this._checkConcurrentJobLimit(userId);

      let parsingJob;
      let backgroundJob;

      await transactionManager.executeAtomic(async (session) => {
        // ... (existing code for jobData preparation)
        const mimeType = cv.metadata?.mimeType || cv.mimeType;
        const originalFilename = cv.metadata?.originalFilename || cv.originalFileName;
        const fileSize = cv.metadata?.fileSize || cv.fileSize || NUMERIC_LIMITS.DEFAULT_COUNT;
        const fileName = options.fileName || originalFilename || cv.title || 'Untitled CV';

        // Determine file type
        const fileType = options.fileType || this._getFileType(mimeType, originalFilename);

        // Generate job ID
        const jobId = this.idGenerator.generate(JOB_TYPE.CV_PARSING, userId);

        // Prepare job data
        const jobData = {
          jobId,
          userId,
          cvId,
          fileName,
          fileSize,
          fileType,
          priority: options.priority || JOB_PRIORITY_NAMES[JOB_PRIORITY.NORMAL],
          parsingOptions: {
            extractSkills: options.parsingOptions?.extractSkills !== false,
            extractExperience: options.parsingOptions?.extractExperience !== false,
            extractEducation: options.parsingOptions?.extractEducation !== false,
            extractProjects: options.parsingOptions?.extractProjects !== false,
            extractCertifications: options.parsingOptions?.extractCertifications !== false,
            extractLanguages: options.parsingOptions?.extractLanguages !== false,
            extractPublications: options.parsingOptions?.extractPublications !== false,
          },
        };

        // Create parsing job record
        parsingJob = await this.cvParsingRepository.createJob(jobData, { session });

        // Map string priority to numeric value for background job
        const priorityMap = {
          low: JOB_PRIORITY.LOW,
          normal: JOB_PRIORITY.NORMAL,
          high: JOB_PRIORITY.HIGH,
          urgent: JOB_PRIORITY.URGENT,
          critical: JOB_PRIORITY.CRITICAL,
        };
        const numericPriority = priorityMap[String(jobData.priority).toLowerCase()] || JOB_PRIORITY.NORMAL;

        // Create background job
        const backgroundJobData = {
          cvId,
          userId,
          jobId: parsingJob.jobId,
          parsingOptions: parsingJob.parsingOptions,
        };

        const jobOptions = {
          userId,
          priority: numericPriority,
          session,
        };

        backgroundJob = await this.jobService.createJob(
          JOB_TYPE.CV_PARSING,
          backgroundJobData,
          jobOptions
        );

        // Link background job to parsing job
        await this.cvParsingRepository.updateJob(
          parsingJob.jobId,
          { backgroundJobId: backgroundJob.jobId },
          { session }
        );

        logger.info('CV parsing job created in DB', {
          jobId: parsingJob.jobId,
          backgroundJobId: backgroundJob.jobId,
          userId,
          cvId,
        });
      });

      // Enqueue job AFTER transaction commits
      if (backgroundJob) {
        await this.jobService.enqueueJob(backgroundJob);
        logger.info('CV parsing job enqueued', {
          jobId: parsingJob.jobId,
          backgroundJobId: backgroundJob.jobId
        });
      }

      return parsingJob;
    } catch (error) {
      logger.error('Start parsing failed', {
        error: error.message,
        userId,
        cvId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Cancel parsing job
   *
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async cancelJob(jobId, userId) {
    try {
      const job = await this.cvParsingRepository.findJobById(jobId);

      if (!job) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }

      // Verify ownership
      requireOwnership(
        job.userId.toString(),
        userId,
        'parsing job',
        ERROR_CODES.FORBIDDEN
      );

      // Check if job can be cancelled
      if ([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED].includes(job.status)) {
        throw ErrorFactory.validationFailed(
          `Cannot cancel job with status: ${job.status}`,
          ERROR_CODES.CV_PARSING_CANCEL_DENIED
        );
      }

      // Cancel parsing job
      await this.cvParsingRepository.cancelJob(jobId, 'Cancelled by user');

      // Cancel background job if exists
      if (job.backgroundJobId) {
        try {
          await this.jobService.cancelJob(
            job.backgroundJobId,
            'Parsing job cancelled by user'
          );
        } catch (error) {
          logger.warn('Failed to cancel background job', {
            backgroundJobId: job.backgroundJobId,
            error: error.message,
          });
          // Don't throw - parsing job is already cancelled
        }
      }

      logger.info('CV parsing job cancelled', { jobId, userId });
    } catch (error) {
      logger.error('Cancel parsing job failed', {
        error: error.message,
        jobId,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get supported file formats
   *
   * @returns {Promise<Array<string>>} Supported formats
   */
  async getSupportedFormats() {
    try {
      // Could be extended to fetch from parser configurations
      const configs = await this.cvParsingRepository.getParserConfigs();

      if (configs.length > 0) {
        const formats = new Set();
        configs.forEach(config => {
          config.supportedFormats?.forEach(format => formats.add(format));
        });
        return Array.from(formats);
      }

      // Fallback to default formats
      return ['pdf', 'docx', 'doc'];
    } catch (error) {
      logger.error('Failed to get supported formats', {
        error: error.message
      });
      // Return default formats on error
      return ['pdf', 'docx', 'doc'];
    }
  }

  /**
   * Process parsing job (called by worker)
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @returns {Promise<Object>} Processing result
   */
  async processParsingJob(jobId, data) {
    const startTime = Date.now();

    try {
      // Get job info
      const parsingJob = await this.cvParsingRepository.findJobById(jobId);
      if (!parsingJob) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }

      const cvId = parsingJob.cvId;
      const userId = parsingJob.userId;

      logger.info('Processing CV parsing job', { jobId, cvId, userId });

      // Stage 1: Starting
      await this._updateParsingProgress(cvId, userId, 5, 'Initializing parser...');
      await this.cvParsingRepository.updateJob(jobId, {
        status: JOB_STATUS.PROCESSING,
        progress: 10,
        'metadata.processingStartTime': new Date(),
      });

      // Get CV content
      const cv = await this.cvRepository.getCVById(cvId, userId);
      if (!cv) {
        throw ErrorFactory.cvNotFound(cvId);
      }

      const filePath = cv.metadata?.filePath || cv.metadata?.s3Key;

      logger.debug('CV record fetched for processing', {
        cvId: cv.id,
        userId: cv.userId,
        filePath,
        metadata: cv.metadata,
        title: cv.title
      });

      if (!filePath) {
        throw ErrorFactory.validationFailed('CV file path not found', ERROR_CODES.FILE_NOT_FOUND);
      }

      // Initialize detailed logger for this job
      const cvTitle = cv.title || cv.metadata?.originalName || 'CV';
      const processingLogger = new CVProcessingLogger(cvId, cvTitle, jobId);
      await processingLogger.init({
        fileName: cv.metadata?.originalName,
        mimeType: cv.metadata?.mimeType,
        fileSize: cv.metadata?.fileSize,
      });

      // Stage 2: Downloading file
      await this._updateParsingProgress(cvId, userId, 15, 'Downloading file...');
      const fileBuffer = await this.fileService.downloadFile(filePath);
      await this.cvParsingRepository.updateJob(jobId, { progress: 25 });

      // Stage 3: Extracting text
      await this._updateParsingProgress(cvId, userId, 30, 'Extracting text from PDF...');
      const text = await this._extractText(fileBuffer, parsingJob.fileType);

      // Log extracted text
      if (processingLogger) {
        await processingLogger.saveExtractedText(text);
      }

      await this.cvParsingRepository.updateJob(jobId, { progress: 40 });

      // Run AI parsing with internal progress updates
      logger.info('Running AI content parser with progress callback', { jobId, cvId: cv.id });
      const { parsedContent } = await this.aiContentParserService.parseContent(text, {}, {
        onProgress: (progress, stage) => {
          this._updateParsingProgress(cvId, userId, progress, stage);
        },
        processingLogger, // Pass logger for multipass recording
      });
      await this.cvParsingRepository.updateJob(jobId, { progress: 85 });

      // Stage 8: Normalizing data
      await this._updateParsingProgress(cvId, userId, 90, 'Normalizing parsed data...');
      const CVDataTransformer = require('@utils/cv-data-transformer');
      const normalizedContent = CVDataTransformer.normalize(parsedContent);

      // Log final parsed content
      if (processingLogger) {
        await processingLogger.saveParsedContent(normalizedContent);
      }


      // Prepare result
      const processingTime = Date.now() - startTime;
      const result = {
        parsedContent: normalizedContent,
        confidence: 0.95,
        processingTime,
        pagesProcessed: 1, // Should be extracted from document
        sectionsFound: Object.keys(normalizedContent).filter(
          k => normalizedContent[k] &&
            (Array.isArray(normalizedContent[k]) ? normalizedContent[k].length > 0 : true)
        ),
      };

      // Complete the job
      const completedJob = await this.cvParsingRepository.completeJob(
        jobId,
        result,
        processingTime
      );

      // Update the CV record with the parsed content
      try {
        logger.info('Updating CV record with parsed content', {
          cvId: cv.id,
          userId: parsingJob.userId,
          hasContent: !!normalizedContent,
        });

        const updatedCV = await this.cvRepository.updateById(cv.id, {
          title: cv.title, // Keep title for safety
          content: normalizedContent,
          status: CV_ENTITY_STATUS.PUBLISHED,
          parsingStatus: CV_STATUS.PARSED,
          isParsed: true,
          parsedAt: new Date(),
          parsedContent: normalizedContent,
          parsingProgress: 100,
        });

        logger.info('CV record updated successfully', {
          cvId: cv.id,
          parsingStatus: updatedCV.parsingStatus,
          isParsed: updatedCV.isParsed,
        });

        // Create the FIRST version with parsed content (marked as active)
        if (this.cvVersionRepository && normalizedContent && Object.keys(normalizedContent).length > 0) {
          try {
            await this.cvVersionRepository.createVersion({
              cvId: cv.id,
              versionNumber: 1,
              userId: parsingJob.userId,
              name: CV_VERSION_NAMES.PARSED,
              description: CV_VERSION_DESCRIPTIONS.PARSED,
              content: normalizedContent,
              changeType: CV_VERSION_CHANGE_TYPE.AI_PARSED,
              isActive: true,
              metadata: {
                wordCount: result.wordCount || 0,
                sectionCount: result.sectionsFound?.length || 0,
              },
            });
            logger.info('Created initial version with parsed content', { cvId: cv.id, versionNumber: 1 });
          } catch (versionError) {
            logger.warn('Failed to create initial version after parsing', {
              error: versionError.message,
              cvId: cv.id,
            });
          }
        }
      } catch (updateError) {
        logger.error('Failed to update CV record after parsing', {
          error: updateError.message,
          stack: updateError.stack,
          cvId: cv.id,
          userId: parsingJob.userId,
        });
        // Don't throw - parsing succeeded, just log the update failure
      }

      logger.info('CV parsing job completed successfully', {
        jobId,
        cvId: cv.id,
        processingTime,
      });

      // Finalize detailed log
      if (processingLogger) {
        await processingLogger.finalizeSuccess(result);
      }

      return completedJob;
    } catch (error) {
      logger.error('Process parsing job failed', {
        error: error.message,
        jobId,
        stack: error.stack,
      });

      // Mark job as failed
      await this.cvParsingRepository.failJob(jobId, error);

      // Finalize detailed log with failure
      // Note: we try to find processingLogger if it was initialized
      if (typeof processingLogger !== 'undefined') {
        await processingLogger.finalizeFailure(error);
      }

      throw error;
    }
  }

  /**
   * Extract text from file buffer using appropriate strategy
   * 
   * @private
   * @param {Buffer} buffer - File buffer
   * @param {string} fileType - File type (pdf, docx, etc.)
   * @param {string} mimeType - MIME type for better detection
   * @returns {Promise<string>} Extracted text
   */
  async _extractText(buffer, fileType, mimeType) {
    try {
      // Use MIME type if available, otherwise map fileType to MIME
      const finalMimeType = mimeType || this._getMimeFromType(fileType);

      const strategy = this.parserStrategyRegistry.getStrategyForFile(finalMimeType);

      if (!strategy) {
        logger.warn('No parsing strategy found for file', {
          fileType,
          mimeType: finalMimeType
        });
        // Fallback to plain text if possible
        return buffer.toString('utf-8');
      }

      logger.info('Using parsing strategy', {
        strategy: strategy.name,
        fileType
      });

      const result = await strategy.parse(buffer);
      return result.content || '';
    } catch (error) {
      logger.error('Text extraction failed', {
        error: error.message,
        fileType,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Map file type extension to MIME type
   * 
   * @private
   * @param {string} type - File type (extension)
   * @returns {string} MIME type
   */
  _getMimeFromType(type) {
    const { EXTENSION_TO_MIME } = require('@constants');
    return EXTENSION_TO_MIME[type] || 'application/octet-stream';
  }

  /**
   * Retry failed parsing job
   *
   * @param {string} jobId - Job ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New job
   */
  async retryFailedJob(jobId, userId) {
    try {
      const job = await this.cvParsingRepository.findJobById(jobId);

      if (!job) {
        throw ErrorFactory.parsingJobNotFound(jobId);
      }

      requireOwnership(
        job.userId.toString(),
        userId,
        'parsing job',
        ERROR_CODES.FORBIDDEN
      );

      if (job.status !== JOB_STATUS.FAILED) {
        throw ErrorFactory.validationFailed(
          'Only failed jobs can be retried',
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Create new parsing job with same options
      return await this.startParsing(userId, job.cvId.toString(), {
        parsingOptions: job.parsingOptions,
        priority: job.priority,
      });
    } catch (error) {
      logger.error('Retry failed job error', {
        error: error.message,
        jobId,
        userId,
      });
      throw error;
    }
  }
}

module.exports = CVParsingService;