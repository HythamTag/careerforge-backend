/**
 * CV ATS SERVICE
 *
 * CV Applicant Tracking System analysis service with job-based workflow.
 * Provides scoring, suggestions, and compatibility analysis.
 *
 * @module modules/cv-ats/services/cv-ats.service
 */

const { ATS_STATUS, ATS_TYPE, ATS_PRIORITY, JOB_PRIORITY, JOB_TYPE, ERROR_CODES, PAGINATION, CV_ATS } = require('@constants');
const mongoose = require('mongoose'); // Add missing import
const { NotFoundError, ValidationError, ErrorFactory } = require('@errors');
const { pagination, requireOwnership } = require('@utils');
const TransactionManager = require('@infrastructure/transaction.manager');
const config = require('@config');

class CvAtsService {
  /**
   * Create CV ATS service with dependency injection.
   * @param {Object} cvAtsRepository - ATS repository
   * @param {Object} jobService - Job service
   * @param {Object} cvRepository - CV repository
   * @param {Object} cvAtsAnalysisService - AI Analysis service
   * @param {Object} versionRepository - CV Version repository
   */
  constructor(cvAtsRepository, jobService, cvRepository, cvAtsAnalysisService, versionRepository) {
    this.cvAtsRepository = cvAtsRepository;
    this.jobService = jobService;
    this.cvRepository = cvRepository;
    this.cvAtsAnalysisService = cvAtsAnalysisService;
    this.versionRepository = versionRepository;
  }

  /**
   * Start a new ATS analysis job
   * Orchestrates validation, job creation, and analysis initialization.
   * 
   * @param {string} userId - User ID
   * @param {Object} analysisData - Analysis configuration
   * @returns {Promise<Object>} Created job details
   */
  async startAnalysis(userId, analysisData) {
    // 1. Validate Request & CV
    const { cv, content, version } = await this._validateAndGetCvContent(userId, analysisData);

    // 2. Idempotency Check (Check for existing active job)
    const activeJob = await this.cvAtsRepository.findActiveJob(
      analysisData.cvId,
      analysisData.type || ATS_TYPE.COMPREHENSIVE,
      analysisData.versionId,
      analysisData.targetJob?.description
    );

    if (activeJob) {
      this.logger.info('Returning existing active ATS job for idempotency', {
        jobId: activeJob.jobId,
        cvId: analysisData.cvId,
        status: activeJob.status
      });

      // Fetch the full job details to return
      const job = await this.jobService.findJobById(activeJob.jobId);
      if (job) {
        return this._mapToAnalysisStartResponse(job, activeJob, analysisData.type);
      }
      // If job document is missing but ATS record exists, proceed to create new one
    }

    // 3. Execute Atomic Creation
    const { job, atsAnalysis } = await this._createAnalysisTransaction(userId, analysisData, content);

    // 3. Enqueue Job (Side Effect - outside transaction)
    await this.jobService.enqueueJob(job);

    // 4. Return DTO
    return this._mapToAnalysisStartResponse(job, atsAnalysis, analysisData.type);
  }

  /**
   * Validate request and retrieve CV content
   * @private
   */
  async _validateAndGetCvContent(userId, data) {
    const cv = await this.cvRepository.getCVById(data.cvId, userId);
    if (!cv) {
      throw ErrorFactory.cvNotFound(data.cvId);
    }

    let content = cv.content;
    let version = null;

    if (data.versionId) {
      version = await this.versionRepository.findById(data.versionId);
      if (!version) {
        throw ErrorFactory.versionNotFound(data.versionId);
      }
      content = version.content;
    }

    return { cv, content, version };
  }

  /**
   * Create analysis and job within a transaction
   * @private
   */
  async _createAnalysisTransaction(userId, data, cvContent) {
    let job;
    let atsAnalysis;

    await TransactionManager.executeAtomic(async (session) => {
      const analysisId = new mongoose.Types.ObjectId();
      const { type = ATS_TYPE.COMPREHENSIVE, priority = ATS_PRIORITY.MEDIUM, targetJob, parameters, cvId, versionId } = data;

      // Create Job
      job = await this.jobService.createJob(
        JOB_TYPE.ATS_ANALYSIS,
        { analysisId, cvId, versionId, type, parameters },
        {
          userId,
          priority: this.mapPriorityToJobPriority(priority),
          session,
          metadata: {
            analysisType: type,
            cvId,
            versionId,
            targetJobTitle: targetJob ? targetJob.title : 'General Analysis',
          },
        }
      );

      // Create Analysis Record
      atsAnalysis = await this.cvAtsRepository.create({
        _id: analysisId,
        jobId: job._id,
        userId,
        cvId,
        versionId,
        type,
        priority,
        targetJob: targetJob || { title: 'General Analysis' },
        parameters,
        cvContent,
        status: ATS_STATUS.PENDING,
        totalSteps: this.getTotalStepsForType(type),
        queuedAt: new Date(),
      }, { session });
    });

    return { job, atsAnalysis };
  }

  /**
   * Map response for start analysis
   * @private
   */
  _mapToAnalysisStartResponse(job, analysis, type) {
    return {
      jobId: job._id,
      analysisId: analysis._id,
      status: analysis.status,
      type: analysis.type,
      queuedAt: analysis.queuedAt,
      estimatedTime: this.getEstimatedTimeForType(type),
      _links: {
        self: `/v1/cv-ats/${job._id}`,
        status: `/v1/cv-ats/${job._id}`,
        cancel: `/v1/cv-ats/${job._id}/cancel`,
      },
    };
  }

  /**
     * Get ATS analysis job status
     */
  async getAnalysisStatus(jobId, userId) {
    const atsAnalysis = await this.cvAtsRepository.findByJobId(jobId);

    if (!atsAnalysis) {
      throw ErrorFactory.atsJobNotFound(jobId);
    }
    if (atsAnalysis.userId) {
      requireOwnership(atsAnalysis.userId, userId, 'ATS analysis', ERROR_CODES.FORBIDDEN);
    }

    // Get job details (may not exist if job was deleted, so use findJobById)
    const job = await this.jobService.findJobById(jobId);

    return {
      jobId: atsAnalysis.jobId,
      analysisId: atsAnalysis._id,
      status: atsAnalysis.status,
      progress: atsAnalysis.progress,
      currentStep: atsAnalysis.currentStep,
      type: atsAnalysis.type,
      priority: atsAnalysis.priority,
      targetJob: {
        title: atsAnalysis.targetJob.title,
        company: atsAnalysis.targetJob.company,
      },
      queuedAt: atsAnalysis.queuedAt,
      startedAt: atsAnalysis.startedAt,
      completedAt: atsAnalysis.completedAt,
      failedAt: atsAnalysis.failedAt,
      processingTimeMs: atsAnalysis.processingTimeMs,
      aiProvider: atsAnalysis.aiProvider,
      aiModel: atsAnalysis.aiModel,
      tokensUsed: atsAnalysis.tokensUsed,
      cost: atsAnalysis.cost,
      overallScore: atsAnalysis.results?.overallScore,
      error: atsAnalysis.error,
      retryCount: atsAnalysis.retryCount,
      jobStatus: job ? job.status : null,
      _links: {
        self: `/v1/cv-ats/${jobId}`,
        result: atsAnalysis.status === ATS_STATUS.COMPLETED ? `/v1/cv-ats/${jobId}/result` : null,
        cancel: [ATS_STATUS.PENDING, ATS_STATUS.PROCESSING].includes(atsAnalysis.status) ? `/v1/cv-ats/${jobId}/cancel` : null,
      },
    };
  }

  /**
     * Get ATS analysis result
     */
  async getAnalysisResult(jobId, userId) {
    const atsAnalysis = await this.cvAtsRepository.findByJobId(jobId);

    if (!atsAnalysis) {
      throw ErrorFactory.atsJobNotFound(jobId);
    }
    if (atsAnalysis.userId) {
      requireOwnership(atsAnalysis.userId, userId, 'ATS analysis', ERROR_CODES.FORBIDDEN);
    }

    if (atsAnalysis.status !== ATS_STATUS.COMPLETED) {
      throw ErrorFactory.validationFailed('ATS analysis job is not completed yet', ERROR_CODES.ATS_JOB_INCOMPLETE);
    }

    return {
      jobId: atsAnalysis.jobId,
      analysisId: atsAnalysis._id,
      type: atsAnalysis.type,
      targetJob: atsAnalysis.targetJob,
      cvContent: atsAnalysis.cvContent,
      results: atsAnalysis.results,
      parameters: atsAnalysis.parameters,
      processingTimeMs: atsAnalysis.processingTimeMs,
      tokensUsed: atsAnalysis.tokensUsed,
      cost: atsAnalysis.cost,
      aiProvider: atsAnalysis.aiProvider,
      aiModel: atsAnalysis.aiModel,
      completedAt: atsAnalysis.completedAt,
      _links: {
        self: `/v1/cv-ats/${jobId}/result`,
        analysis: `/v1/cv-ats/${jobId}`,
      },
    };
  }

  /**
     * Get user's ATS analysis history
     */
  async getAnalysisHistory(userId, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      type,
      cvId,
      sort = '-createdAt',
    } = options;

    const filters = {
      status,
      type,
      cvId,
      sort,
      limit,
      skip: (page - 1) * limit,
      populate: ['job', 'cv'],
    };

    const [analyses, total] = await Promise.all([
      this.cvAtsRepository.findByUserId(userId, filters),
      this.cvAtsRepository.countByUserId(userId, { status, type, cvId }),
    ]);

    const historyItems = analyses.map(analysis => ({
      jobId: analysis.jobId,
      analysisId: analysis._id,
      status: analysis.status,
      type: analysis.type,
      overallScore: analysis.results?.overallScore,
      targetJob: {
        title: analysis.targetJob.title,
        company: analysis.targetJob.company,
      },
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt,
      processingTimeMs: analysis.processingTimeMs,
      cv: analysis.cvId ? {
        id: analysis.cvId._id,
        title: analysis.cvId.title,
        status: analysis.cvId.status,
      } : null,
      _links: {
        self: `/v1/cv-ats/${analysis.jobId}`,
        result: analysis.status === ATS_STATUS.COMPLETED ? `/v1/cv-ats/${analysis.jobId}/result` : null,
      },
    }));

    const paginationInfo = pagination.calculate(page, limit, total);
    const baseUrl = '/v1/cv-ats/history';

    return {
      data: historyItems,
      pagination: paginationInfo,
      _links: pagination.generateLinks(baseUrl, paginationInfo),
    };
  }

  /**
     * Cancel ATS analysis job
     */
  async cancelAnalysis(jobId, userId) {
    const atsAnalysis = await this.cvAtsRepository.findByJobId(jobId);

    if (!atsAnalysis) {
      throw ErrorFactory.atsJobNotFound(jobId);
    }
    if (atsAnalysis.userId) {
      requireOwnership(atsAnalysis.userId, userId, 'ATS analysis', ERROR_CODES.FORBIDDEN);
    }

    if (![ATS_STATUS.PENDING, ATS_STATUS.PROCESSING].includes(atsAnalysis.status)) {
      throw ErrorFactory.validationFailed(`Cannot cancel job with status: ${atsAnalysis.status}`, ERROR_CODES.ATS_JOB_CANCEL_DENIED);
    }

    // Cancel the ATS analysis job
    await this.cvAtsRepository.cancelJob(atsAnalysis._id);

    // Cancel the underlying job
    await this.jobService.cancelJob(jobId);

    return {
      jobId,
      status: ATS_STATUS.CANCELLED,
      cancelledAt: new Date(),
      message: 'ATS analysis job cancelled successfully',
    };
  }

  /**
     * Get ATS analysis statistics
     */
  async getAnalysisStats(userId) {
    const [stats, scoreDistribution, topSuggestions] = await Promise.all([
      this.cvAtsRepository.getUserStats(userId),
      this.cvAtsRepository.getScoreDistribution(userId),
      this.cvAtsRepository.getTopSuggestions(userId, CV_ATS.DEFAULT_TOP_SUGGESTIONS_LIMIT),
    ]);

    return {
      overview: stats,
      scoreDistribution,
      topSuggestions,
      _links: {
        self: '/v1/cv-ats/stats',
        history: '/v1/cv-ats/history',
      },
    };
  }

  /**
   * Process an ATS analysis job (called by worker)
   */
  async processAtsJob(jobId, data, job) {
    const { analysisId, cvId, type = ATS_TYPE.COMPREHENSIVE, parameters = {} } = data;

    // 1. Get analysis record
    const analysis = await this.cvAtsRepository.findById(analysisId);
    if (!analysis) {
      throw ErrorFactory.atsJobNotFound(analysisId);
    }

    // 2. Idempotency check
    if (analysis.status === ATS_STATUS.COMPLETED) {
      return {
        analysisId,
        alreadyCompleted: true,
        qualityScore: analysis.results?.overallScore || 0,
      };
    }

    // 3. Mark as processing
    const startTime = new Date();
    await this.startProcessing(analysisId);

    // 4. Update progress
    await this.jobService.updateJobProgress(jobId, 25, 'Analyzing content against ATS rules');

    // 5. Run ATS Analysis
    let analysisResult;

    if (analysis.type === ATS_TYPE.COMPATIBILITY || analysis.type === 'job_match') {
      if (!analysis.targetJob || !analysis.targetJob.description) {
        // Fallback if no target job provided
        analysisResult = await this.cvAtsAnalysisService.evaluateCV(
          analysis.cvContent || {},
          { ...parameters, model: config.ai?.models?.ats?.ollama }
        );
      } else {
        analysisResult = await this.cvAtsAnalysisService.analyzeJobCompatibility(
          analysis.cvContent || {},
          analysis.targetJob,
          { ...parameters, model: config.ai?.models?.ats?.ollama }
        );
        // Map job compatibility result to standard format
        analysisResult.breakdown = {
          structure: 30, // Default or calculated
          skills: (analysisResult.skillsMatch || 0) / 4, // map 100 to 25
          experience: (analysisResult.experienceMatch || 0) / 4, // map 100 to 25
          formatting: 10
        };
      }
    } else {
      analysisResult = await this.cvAtsAnalysisService.evaluateCV(
        analysis.cvContent || {},
        { ...parameters, model: config.ai?.models?.ats?.ollama }
      );
    }

    // 6. Complete and save results
    const qualityScore = analysisResult.atsScore || analysisResult.overallScore || 0;

    const results = {
      overallScore: qualityScore,
      breakdown: analysisResult.breakdown || {},
      sectionScores: analysisResult.sectionScores || {},
      keywords: analysisResult.keywords || [],
      missingKeywords: analysisResult.missingKeywords || [],
      formattingIssues: analysisResult.formattingIssues || [], // Check schema if this exists
      recommendations: analysisResult.improvementSuggestions || analysisResult.recommendations || [],
      strengths: analysisResult.strengths || [],
      weaknesses: analysisResult.weaknesses || [],
      detailedFeedback: analysisResult.detailedFeedback || '',
    };

    await this.completeAnalysis(analysisId, results, {
      processingTimeMs: new Date() - startTime,
    });

    return {
      analysisId,
      qualityScore,
      improvements: (results.improvementSuggestions || []).length,
    };
  }

  /**
   * Start processing analysis
   */
  async startProcessing(analysisId) {
    return await this.cvAtsRepository.updateById(analysisId, {
      status: ATS_STATUS.PROCESSING,
      startedAt: new Date(),
      currentStep: 'Analyzing CV content',
    });
  }

  /**
   * Complete analysis
   */
  async completeAnalysis(analysisId, results, stats = {}) {
    return await this.cvAtsRepository.updateById(analysisId, {
      status: ATS_STATUS.COMPLETED,
      results,
      completedAt: new Date(),
      progress: 100,
      currentStep: 'Analysis completed successfully',
      processingTimeMs: stats.processingTimeMs,
    });
  }

  /**
   * Fail analysis
   */
  async failAnalysis(analysisId, error) {
    return await this.cvAtsRepository.updateById(analysisId, {
      status: ATS_STATUS.FAILED,
      error: error.message,
      failedAt: new Date(),
      currentStep: 'Analysis failed',
    });
  }

  /**
   * Update progress
   */
  async updateProgress(analysisId, progress, currentStep = null) {
    const updateData = {
      progress: Math.min(Math.max(progress, 0), 100),
    };

    if (currentStep) {
      updateData.currentStep = currentStep;
    }

    return await this.cvAtsRepository.updateById(analysisId, updateData);
  }

  /**
   * Map ATS priority to background job priority
   * 
   * @private
   * @param {string} priority - ATS priority (low, medium, high, urgent)
   * @returns {number} Numeric job priority
   */
  mapPriorityToJobPriority(priority) {
    const priorityMap = {
      [ATS_PRIORITY.LOW]: JOB_PRIORITY.LOW,
      [ATS_PRIORITY.MEDIUM]: JOB_PRIORITY.NORMAL,
      [ATS_PRIORITY.HIGH]: JOB_PRIORITY.HIGH,
      [ATS_PRIORITY.URGENT]: JOB_PRIORITY.URGENT,
    };

    return priorityMap[priority] || JOB_PRIORITY.NORMAL;
  }

  /**
   * Get total steps for analysis type
   * 
   * @private
   * @param {string} type - Analysis type
   * @returns {number} Total steps
   */
  getTotalStepsForType(type) {
    const stepsMap = {
      [ATS_TYPE.COMPATIBILITY]: 3,
      [ATS_TYPE.KEYWORD_ANALYSIS]: 4,
      [ATS_TYPE.FORMAT_CHECK]: 2,
      [ATS_TYPE.COMPREHENSIVE]: 6,
    };

    return stepsMap[type] || 5;
  }

  /**
   * Get estimated time for analysis type
   * 
   * @private
   * @param {string} type - Analysis type
   * @returns {number} Estimated time in milliseconds
   */
  getEstimatedTimeForType(type) {
    const timeMap = {
      [ATS_TYPE.COMPATIBILITY]: 15000,
      [ATS_TYPE.KEYWORD_ANALYSIS]: 20000,
      [ATS_TYPE.FORMAT_CHECK]: 10000,
      [ATS_TYPE.COMPREHENSIVE]: 45000,
    };

    return timeMap[type] || 30000;
  }
}

module.exports = CvAtsService;

