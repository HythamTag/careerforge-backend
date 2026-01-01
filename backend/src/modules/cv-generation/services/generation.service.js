// ============================================================================
// FILE: modules/cv-generation/services/generation.service.js
// ============================================================================

/**
 * GENERATION SERVICE
 *
 * Business logic for CV generation operations.
 * Handles validation, quota checks, and orchestrates generation workflow.
 */

const mongoose = require('mongoose');
const transactionManager = require('@infrastructure/transaction.manager');
const {
  OUTPUT_FORMAT,
  GENERATION_STATUS,
  GENERATION_TYPE,
  JOB_PRIORITY,
  JOB_TYPE,
  PAGINATION,
  ERROR_CODES,
  USER_LIMITS,
  TEMPLATES,
  PROGRESS_MILESTONES,
} = require('@constants');
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');
const { logger, pagination, requireOwnership } = require('@utils');
const CVDataTransformer = require('@utils/cv-data-transformer');

class GenerationService {
  constructor(
    generationRepository,
    jobService,
    cvRepository,
    fileService,
    templateRenderer,
    versionRepository,
    pdfGenerator
  ) {
    this.generationRepository = generationRepository;
    this.jobService = jobService;
    this.cvRepository = cvRepository;
    this.fileService = fileService;
    this.templateRenderer = templateRenderer;
    this.versionRepository = versionRepository;
    this.pdfGenerator = pdfGenerator;
  }

  /**
   * Start a new CV generation job with transaction support
   */
  async startGeneration(userId, generationData) {
    // Step 1: Validate input
    this.validateGenerationInput(generationData);

    // Step 2: Check user quota
    await this.checkUserQuota(userId);

    // Step 3: Extract data
    const {
      cvId,
      versionId,
      templateId,
      outputFormat = OUTPUT_FORMAT.PDF,
      type = GENERATION_TYPE.FROM_CV,
      parameters = {},
      inputData,
    } = generationData;

    // Step 4: Get CV data
    const cvData = await this.getCVData(userId, cvId, versionId, inputData);

    // Step 5: Normalize data
    const normalizedData = CVDataTransformer.normalize(cvData);

    logger.debug('CV data normalized for generation', {
      userId,
      cvId,
      hasPersonalInfo: !!normalizedData.personalInfo,
      workExperienceCount: normalizedData.workExperience?.length || 0,
    });

    // Step 6: Create generation and job atomically
    return await this.createGenerationJob(userId, {
      cvId,
      versionId,
      templateId,
      outputFormat,
      type,
      parameters,
      inputData: normalizedData,
    });
  }

  /**
   * Validate generation input
   */
  validateGenerationInput(data) {
    if (!data.cvId && !data.inputData) {
      throw new ValidationError(
        'Either cvId or inputData is required',
        ERROR_CODES.GENERATION_MISSING_DATA
      );
    }

    if (data.outputFormat && !Object.values(OUTPUT_FORMAT).includes(data.outputFormat)) {
      throw new ValidationError(
        `Invalid output format: ${data.outputFormat}`,
        ERROR_CODES.GENERATION_INVALID_FORMAT
      );
    }

    if (data.templateId && !TEMPLATES[data.templateId]) {
      throw ErrorFactory.validationFailed(`Invalid template: ${data.templateId}`, ERROR_CODES.TEMPLATE_NOT_FOUND);
    }
  }

  /**
   * Check if user has quota for new generation
   */
  async checkUserQuota(userId) {
    const activeJobs = await this.generationRepository.countByUserId(userId, {
      status: [GENERATION_STATUS.PENDING, GENERATION_STATUS.PROCESSING],
    });

    if (activeJobs >= USER_LIMITS.MAX_GENERATION_JOBS) {
      throw new ValidationError(
        `Maximum concurrent generations (${USER_LIMITS.MAX_GENERATION_JOBS}) exceeded`,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      ).withUserId(userId)
        .withContext('activeJobs', activeJobs)
        .withContext('limit', USER_LIMITS.MAX_GENERATION_JOBS);
    }
  }

  /**
   * Get CV data from various sources
   */
  async getCVData(userId, cvId, versionId, inputData) {
    if (inputData) return inputData;

    if (!cvId) {
      throw new ValidationError(
        'CV ID is required when inputData is not provided',
        ERROR_CODES.GENERATION_MISSING_DATA
      );
    }

    const cv = await this.cvRepository.getCVById(cvId, userId);
    if (!cv) {
      throw ErrorFactory.cvNotFound(cvId);
    }

    if (versionId) {
      const version = await this.versionRepository.findById(versionId);

      if (!version) {
        throw ErrorFactory.versionNotFound(versionId);
      }

      return version.content;
    }

    return cv.content;
  }

  /**
   * Create generation and job records atomically
   */
  async createGenerationJob(userId, data) {
    let job;
    let generation;

    await transactionManager.executeAtomic(async (session) => {
      const generationId = new mongoose.Types.ObjectId();

      // Create job first
      const jobData = {
        generationId,
        cvId: data.cvId,
        versionId: data.versionId,
        templateId: data.templateId,
        outputFormat: data.outputFormat,
        inputData: data.inputData,
      };

      const jobOptions = {
        userId,
        priority: this.mapPriority(data.parameters.priority),
        metadata: {
          generationType: data.type,
          cvId: data.cvId,
          versionId: data.versionId,
          templateId: data.templateId,
          outputFormat: data.outputFormat,
        },
        session,
      };

      job = await this.jobService.createJob(
        JOB_TYPE.CV_GENERATION,
        jobData,
        jobOptions
      );

      // Create generation record
      generation = await this.generationRepository.create({
        _id: generationId,
        jobId: job._id,
        userId,
        cvId: data.cvId,
        versionId: data.versionId,
        type: data.type,
        outputFormat: data.outputFormat,
        templateId: data.templateId,
        parameters: data.parameters,
        inputData: data.inputData,
        status: GENERATION_STATUS.PENDING,
        totalSteps: this.getTotalStepsForFormat(data.outputFormat),
      }, { session });
    }).catch((error) => {
      logger.error('Failed to create generation job', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw error;
    });

    // Enqueue job only AFTER transaction has committed to ensure visibility for workers
    if (job) {
      try {
        await this.jobService.enqueueJob(job);
      } catch (enqueueError) {
        // If enqueue fails, we might want to fail the generation, but the DB record is already committed.
        // For now, log critical error. Background sweeper should pick it up or user can retry.
        logger.error('Failed to enqueue job after creation', { jobId: job._id, error: enqueueError.message });
      }
    }

    logger.info('Generation job created successfully', {
      jobId: job._id,
      generationId: generation._id,
      userId,
      outputFormat: data.outputFormat,
    });

    return this._mapToGenerationResponse(job, generation, data);
  }

  /**
   * Get generation job status
   */
  async getGenerationStatus(jobId, userId) {
    const generation = await this.generationRepository.findByJobId(jobId);

    if (!generation) {
      throw ErrorFactory.generationJobNotFound(jobId);
    }

    requireOwnership(generation.userId, userId, 'generation job', ERROR_CODES.FORBIDDEN);

    const job = await this.jobService.findJobById(jobId);

    return this._mapToStatusResponse(generation, job);
  }

  /**
   * Prepare file download
   */
  async prepareDownload(jobId, userId) {
    const generation = await this.generationRepository.findByJobId(jobId);

    if (!generation) {
      throw ErrorFactory.generationJobNotFound(jobId);
    }

    requireOwnership(generation.userId, userId, 'generation job', ERROR_CODES.FORBIDDEN);

    if (!generation.isCompleted()) {
      throw new ValidationError(
        'Generation job is not completed yet',
        ERROR_CODES.GENERATION_JOB_INCOMPLETE
      ).withContext('status', generation.status);
    }

    const storageKey = generation.outputFile?.s3Key || generation.outputFile?.filePath;

    if (!storageKey) {
      throw new ValidationError(
        'No file available for download',
        ERROR_CODES.FILE_NOT_FOUND
      ).withContext('generationId', generation._id);
    }

    try {
      const fileBuffer = await this.fileService.downloadFile(storageKey);

      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new ValidationError(
          'Downloaded file is invalid or empty',
          ERROR_CODES.FILE_NOT_FOUND
        );
      }

      logger.info('File prepared for download', {
        jobId,
        fileSize: fileBuffer.length,
        fileName: generation.outputFile.fileName,
      });

      return {
        buffer: fileBuffer,
        fileName: generation.outputFile.fileName || `cv-${jobId}.${generation.outputFormat}`,
        mimeType: generation.outputFile.mimeType || this.getMimeType(generation.outputFormat),
        size: fileBuffer.length,
      };
    } catch (error) {
      logger.error('Failed to prepare file download', {
        error: error.message,
        storageKey,
        jobId,
      });

      if (error instanceof ValidationError) throw error;

      throw new ValidationError(
        'Failed to retrieve file from storage',
        ERROR_CODES.FILE_NOT_FOUND
      ).withContext('storageKey', storageKey);
    }
  }

  /**
   * Get user's generation history
   */
  async getGenerationHistory(userId, options = {}) {
    const {
      page = 1,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      type,
      format,
      cvId,
      sort = '-createdAt',
    } = options;

    const filters = {
      status,
      type,
      format,
      cvId,
      sort,
      limit,
      skip: (page - 1) * limit,
      populate: ['job', 'cv'],
    };

    const [generations, total] = await Promise.all([
      this.generationRepository.findByUserId(userId, filters),
      this.generationRepository.countByUserId(userId, { status, type, format, cvId }),
    ]);

    const historyItems = generations.map(gen => ({
      jobId: gen.jobId,
      generationId: gen._id,
      status: gen.status,
      type: gen.type,
      outputFormat: gen.outputFormat,
      templateId: gen.templateId,
      progress: gen.progress,
      createdAt: gen.createdAt,
      completedAt: gen.completedAt,
      processingTimeMs: gen.generationStats?.processingTimeMs,
      outputFile: gen.outputFile ? {
        fileName: gen.outputFile.fileName,
        fileSize: gen.outputFile.fileSize,
      } : null,
      cv: gen.cvId ? {
        id: gen.cvId._id,
        title: gen.cvId.title,
        status: gen.cvId.status,
      } : null,
      _links: {
        self: `/v1/generation/${gen.jobId}`,
        download: gen.isCompleted() ? `/v1/generation/${gen.jobId}/download` : null,
      },
    }));

    const paginationInfo = pagination.calculate(page, limit, total);
    const baseUrl = '/v1/generation/history';

    return {
      data: historyItems,
      pagination: paginationInfo,
      _links: pagination.generateLinks(baseUrl, paginationInfo),
    };
  }

  /**
   * Cancel generation job
   */
  async cancelGeneration(jobId, userId) {
    const generation = await this.generationRepository.findByJobId(jobId);

    if (!generation) {
      throw ErrorFactory.generationJobNotFound(jobId);
    }

    requireOwnership(generation.userId, userId, 'generation job', ERROR_CODES.FORBIDDEN);

    if (!generation.canBeCancelled()) {
      throw new ValidationError(
        `Cannot cancel job with status: ${generation.status}`,
        ERROR_CODES.GENERATION_JOB_CANCEL_DENIED
      ).withContext('status', generation.status);
    }

    // Update generation status
    await this.generationRepository.updateById(generation._id, {
      status: GENERATION_STATUS.CANCELLED,
      cancelledAt: new Date(),
      progress: 0,
      currentStep: 'Generation cancelled by user',
    });

    // Cancel underlying job
    await this.jobService.cancelJob(jobId);

    return {
      jobId,
      status: GENERATION_STATUS.CANCELLED,
      cancelledAt: new Date(),
      message: 'Generation job cancelled successfully',
    };
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(userId) {
    const [stats, formatStats] = await Promise.all([
      this.generationRepository.getUserStats(userId),
      this.generationRepository.getFormatStats(userId),
    ]);

    if (stats.length === 0) {
      return {
        overview: {
          totalJobs: 0,
          pendingJobs: 0,
          processingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          cancelledJobs: 0,
          totalFileSize: 0,
          avgQualityScore: null,
          avgProcessingTime: null,
        },
        byFormat: [],
      };
    }

    return {
      overview: stats[0],
      byFormat: formatStats,
      _links: {
        self: '/v1/generation/stats',
        history: '/v1/generation/history',
      },
    };
  }

  /**
   * Preview generation (without creating job)
   */
  async previewGeneration(userId, previewData) {
    const { cvId, versionId, templateId } = previewData;

    // Get CV data
    const cvData = await this.getCVData(userId, cvId, versionId, null);

    // Normalize data
    const normalizedData = CVDataTransformer.normalize(cvData);

    // Validate template
    if (templateId && !TEMPLATES[templateId]) {
      throw ErrorFactory.templateNotFound(templateId);
    }

    const preview = {
      template: TEMPLATES[templateId] || TEMPLATES.modern,
      data: normalizedData,
      previewUrl: `/v1/generation/preview/${Date.now()}`,
    };

    return {
      preview,
      _links: {
        self: '/v1/generation/preview',
      },
    };
  }

  /**
   * Process a generation job (called by worker)
   * 
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Results
   */
  async processGenerationJob(jobId, data, job) {
    const { generationId } = data;

    // 1. Get generation record
    let generation = await this.generationRepository.findById(generationId);
    if (!generation) {
      // Small delay for race condition (sometimes job starts before record is committed)
      await new Promise(resolve => setTimeout(resolve, 200));
      generation = await this.generationRepository.findById(generationId);
      if (!generation) {
        throw ErrorFactory.generationJobNotFound(generationId);
      }
    }

    // 2. Mark as processing
    await this.startProcessing(generationId);

    // 3. Process in steps
    const steps = this.getGenerationSteps(generation.outputFormat);
    const results = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = Math.round(((i + 1) / steps.length) * PROGRESS_MILESTONES.COMPLETE);

      // Update progress in both job and generation record
      await this.jobService.updateJobProgress(jobId, progress, step.name);
      await this.updateProgress(generationId, progress, step.name);

      logger.debug(`Processing generation step: ${step.name}`, { generationId, step: step.type });

      switch (step.type) {
        case 'prepare':
          results.preparedData = await this._prepareData(generation.inputData, generation.parameters);
          break;
        case 'render':
          results.renderedContent = await this._renderContent(results.preparedData, generation.templateId, generation.parameters);
          break;
        case 'format':
          results.formattedOutput = await this._formatOutput(results.renderedContent, generation.outputFormat, generation.parameters);
          break;
        case 'save':
          results.savedFile = await this._saveOutput(results.formattedOutput, generationId, generation.outputFormat);
          break;
        case 'validate':
          results.validation = await this._validateOutput(results.savedFile);
          break;
      }
    }

    // 4. Calculate stats
    const stats = {
      totalSections: Object.keys(results.preparedData).length,
      processingTimeMs: new Date() - generation.startedAt,
      wordCount: this._calculateWordCount(results.formattedOutput),
      pageCount: this._estimatePageCount(results.formattedOutput, generation.outputFormat),
    };

    // 5. Complete generation
    const completed = await this.completeGeneration(generationId, {
      fileName: results.savedFile.fileName,
      filePath: results.savedFile.filePath,
      s3Key: results.savedFile.s3Key,
      fileSize: results.savedFile.fileSize,
      mimeType: results.savedFile.mimeType,
      url: results.savedFile.url,
      downloadUrl: results.savedFile.downloadUrl,
    }, stats);

    logger.info('Generation job processed successfully', { generationId, jobId });

    return {
      generationId,
      fileName: results.savedFile.fileName,
      downloadUrl: results.savedFile.downloadUrl,
    };
  }

  /**
   * Start processing generation
   */
  async startProcessing(generationId) {
    return await this.generationRepository.updateById(generationId, {
      status: GENERATION_STATUS.PROCESSING,
      startedAt: new Date(),
      currentStep: 'Initializing generation',
    });
  }

  /**
   * Complete generation
   */
  async completeGeneration(generationId, results, stats = {}) {
    return await this.generationRepository.updateById(generationId, {
      status: GENERATION_STATUS.COMPLETED,
      outputFile: results,
      generationStats: stats,
      completedAt: new Date(),
      progress: 100,
      currentStep: 'Generation completed successfully',
    });
  }

  /**
   * Fail generation
   */
  async failGeneration(generationId, error) {
    return await this.generationRepository.updateById(generationId, {
      status: GENERATION_STATUS.FAILED,
      error: error.message,
      failedAt: new Date(),
      currentStep: 'Generation failed',
    });
  }

  /**
   * Update progress
   */
  async updateProgress(generationId, progress, currentStep = null) {
    const updateData = {
      progress: Math.min(Math.max(progress, 0), 100),
    };

    if (currentStep) {
      updateData.currentStep = currentStep;
    }

    return await this.generationRepository.updateById(generationId, updateData);
  }

  // ==========================================
  // INTERNAL PROCESSING METHODS
  // ==========================================

  async _prepareData(inputData, parameters) {
    if (!inputData) {
      throw new ValidationError('Input data is missing', ERROR_CODES.GENERATION_MISSING_DATA);
    }

    const prepared = { ...inputData };

    // Apply section filtering
    if (parameters.includeSections?.length > 0) {
      Object.keys(prepared).forEach(k => {
        if (!parameters.includeSections.includes(k) && k !== 'personalInfo') {
          delete prepared[k];
        }
      });
    }

    if (parameters.excludeSections?.length > 0) {
      parameters.excludeSections.forEach(k => delete prepared[k]);
    }

    return prepared;
  }

  async _renderContent(data, templateId, parameters) {
    try {
      return await this.templateRenderer.render(templateId || 'modern', data, parameters || {});
    } catch (error) {
      logger.error('Template rendering failed', { error: error.message, templateId });
      throw error;
    }
  }

  async _formatOutput(content, format, parameters) {
    switch (format.toLowerCase()) {
      case OUTPUT_FORMAT.PDF: {
        const pdfBuffer = await this.pdfGenerator.generateFromHtml(content, parameters || {});
        return { content: pdfBuffer, mimeType: 'application/pdf', format: 'pdf' };
      }
      case OUTPUT_FORMAT.HTML:
        return { content, mimeType: 'text/html', format: 'html' };
      case OUTPUT_FORMAT.JSON:
        return { content: JSON.stringify(content, null, 2), mimeType: 'application/json', format: 'json' };
      default:
        throw new ValidationError(`Unsupported format: ${format}`, ERROR_CODES.GENERATION_INVALID_FORMAT);
    }
  }

  async _saveOutput(output, generationId, format) {
    const fileName = `cv-${generationId}-${Date.now()}.${format}`;
    const filePath = `generations/${generationId}/${fileName}`;

    const uploadResult = await this.fileService.uploadFile(output.content, filePath, {
      mimeType: output.mimeType,
      public: true,
    });

    return {
      fileName,
      filePath: uploadResult.key,
      s3Key: uploadResult.key,
      fileSize: output.content.length,
      mimeType: output.mimeType,
      url: uploadResult.url,
      downloadUrl: uploadResult.url,
    };
  }

  async _validateOutput(savedFile) {
    if (!savedFile.fileSize || savedFile.fileSize === 0) {
      throw new ValidationError('Generated file is empty', ERROR_CODES.GENERATION_FAILED);
    }
    return { isValid: true };
  }

  _calculateWordCount(output) {
    if (typeof output.content === 'string') {
      return output.content.split(/\s+/).length;
    }
    return 0;
  }

  _estimatePageCount(output, format) {
    if (format === OUTPUT_FORMAT.PDF) {
      const words = this._calculateWordCount(output);
      return Math.ceil(words / 400); // Rough estimate
    }
    return 1;
  }

  getGenerationSteps(format) {
    const steps = [
      { name: 'Preparing data', type: 'prepare' },
      { name: 'Rendering content', type: 'render' },
      { name: 'Formatting output', type: 'format' },
      { name: 'Saving file', type: 'save' },
      { name: 'Validating output', type: 'validate' },
    ];
    return steps;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  _mapToGenerationResponse(job, generation, data) {
    return {
      jobId: job._id,
      generationId: generation._id,
      status: generation.status,
      type: generation.type,
      outputFormat: generation.outputFormat,
      queuedAt: generation.queuedAt,
      estimatedTime: this.getEstimatedTimeForFormat(data.outputFormat),
      _links: {
        self: `/v1/generation/${job._id}`,
        status: `/v1/generation/${job._id}`,
        cancel: `/v1/generation/${job._id}/cancel`,
      },
    };
  }

  _mapToStatusResponse(generation, job) {
    return {
      jobId: generation.jobId,
      generationId: generation._id,
      status: generation.status,
      progress: generation.progress,
      currentStep: generation.currentStep,
      type: generation.type,
      outputFormat: generation.outputFormat,
      templateId: generation.templateId,
      parameters: generation.parameters,
      queuedAt: generation.queuedAt,
      startedAt: generation.startedAt,
      completedAt: generation.completedAt,
      failedAt: generation.failedAt,
      processingTimeMs: generation.generationStats?.processingTimeMs,
      error: generation.error,
      retryCount: generation.retryCount,
      jobStatus: job?.status,
      _links: {
        self: `/v1/generation/${generation.jobId}`,
        result: generation.isCompleted() ? `/v1/generation/${generation.jobId}/result` : null,
        download: generation.isCompleted() ? `/v1/generation/${generation.jobId}/download` : null,
        cancel: generation.canBeCancelled() ? `/v1/generation/${generation.jobId}/cancel` : null,
      },
    };
  }

  getMimeType(format) {
    const mimeTypes = {
      [OUTPUT_FORMAT.PDF]: 'application/pdf',
      [OUTPUT_FORMAT.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      [OUTPUT_FORMAT.HTML]: 'text/html',
      [OUTPUT_FORMAT.TXT]: 'text/plain',
      [OUTPUT_FORMAT.JSON]: 'application/json',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  mapPriority(priority) {
    if (!priority) return JOB_PRIORITY.NORMAL;

    if (typeof priority === 'number' && Object.values(JOB_PRIORITY).includes(priority)) {
      return priority;
    }

    const priorityMap = {
      low: JOB_PRIORITY.LOW,
      normal: JOB_PRIORITY.NORMAL,
      high: JOB_PRIORITY.HIGH,
      urgent: JOB_PRIORITY.URGENT,
      critical: JOB_PRIORITY.CRITICAL,
    };

    return priorityMap[priority.toLowerCase()] || JOB_PRIORITY.NORMAL;
  }

  getTotalStepsForFormat(format) {
    return this.getGenerationSteps(format).length;
  }

  getEstimatedTimeForFormat(format) {
    // Return estimated seconds based on format
    switch (format) {
      case OUTPUT_FORMAT.PDF: return 15;
      case OUTPUT_FORMAT.DOCX: return 10;
      default: return 5;
    }
  }
}

module.exports = GenerationService;
