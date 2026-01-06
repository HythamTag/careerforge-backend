/**
 * CV OPTIMIZER SERVICE
 *
 * Handles AI-powered CV content optimization and enhancement.
 * Improves wording, structure, and ATS compatibility of CV content.
 *
 * @module modules/cv-optimizer/services/cv-optimizer.service
 */

const fs = require('fs');
const path = require('path');
const logger = require('@utils/logger');
const config = require('@config');
const CVProcessingLogger = require('@messaging/workers/processors/CVProcessingLogger');

class CVOptimizerService {
  /**
     * Create CV optimizer service.
     *
     * @param {AIService} aiService - AI service for making API calls
     */
  constructor(aiService) {
    this.aiService = aiService;
    this.prompts = {
      optimizer: this._loadPromptTemplate('optimization/cv-optimizer.prompt.txt'),
      // Analysis prompt for Phase 1
      analysis: this._loadPromptTemplate('optimization/1-analysis.prompt.txt'),
      // Tailoring prompt for Phase 2
      tailoring: this._loadPromptTemplate('optimization/2-tailoring.prompt.txt'),
    };
  }

  /**
     * Load a prompt template from the shared prompts directory.
     * @private
     */
  _loadPromptTemplate(relativePath) {
    const promptPath = path.join(__dirname, '../../../shared/external/ai/prompts', relativePath);
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (err) {
      // Log warning but don't crash if new prompts aren't there yet (graceful degradation)
      logger.warn(`Failed to load prompt: ${relativePath}`, { error: err.message });
      return '';
    }
  }

  /**
   * Remove unnecessary fields from CV data to reduce token usage.
   * @private
   */
  _cleanCVData(cvData) {
    if (!cvData) return {};

    const cleaned = { ...cvData };

    // Fields to remove
    const fieldsToRemove = [
      '_id', 'userId', 'createdAt', 'updatedAt', '__v',
      'metadata', 'parsingMetadata', 'parsingStatus',
      'isParsed', 'parsedAt', 'failedAt', 'parsingError',
      'analysis', 'versions'
    ];

    fieldsToRemove.forEach(field => delete cleaned[field]);

    return cleaned;
  }

  /**
   * Verify identity and restore if hallucinated.
   * Compares input name/email with output and restores input if mismatch found.
   * @private
   */
  _verifyAndRestoreIdentity(inputCV, outputCV) {
    if (!inputCV || !outputCV) return outputCV;

    // Helper to get name
    const getName = (cv) => {
      // Handle normalized
      if (cv.personalInfo && (cv.personalInfo.firstName || cv.personalInfo.lastName)) {
        return `${cv.personalInfo.firstName || ''} ${cv.personalInfo.lastName || ''}`.trim();
      }
      // Handle flat structure (legacy/AI output)
      if (cv.name) return cv.name.trim();
      if (cv.personal && cv.personal.name) return cv.personal.name.trim();
      return '';
    };

    const inputName = getName(inputCV);
    const outputName = getName(outputCV);

    // Safety Force: If input has personalInfo, overwrite output's personalInfo
    // This guarantees the name/contact never hallucinates.
    if (inputCV.personalInfo && outputName && inputName && inputName.toLowerCase() !== outputName.toLowerCase()) {
      logger.warn('Hallucination detected in identity! Restoring original identity.', {
        inputName,
        outputName
      });

      // Restore Personal Info block from input
      if (outputCV.personalInfo && inputCV.personalInfo) {
        // Keep output structure but force critical fields
        outputCV.personalInfo = {
          ...outputCV.personalInfo,
          firstName: inputCV.personalInfo.firstName,
          lastName: inputCV.personalInfo.lastName,
          email: inputCV.personalInfo.email,
          phone: inputCV.personalInfo.phone,
          links: inputCV.personalInfo.links || outputCV.personalInfo.links // Keep original links just in case
        };
        // Or just blunt force overwrite to be safe
        outputCV.personalInfo = inputCV.personalInfo;
      }
      // If flat structure
      else {
        outputCV.name = inputName;
      }
    }

    return outputCV;
  }



  /**
     * Optimize CV content for better ATS compatibility and readability.
     *
     * @param {Object} cvData - Parsed CV data
     * @param {Object} options - Optimization options
     * @returns {Promise<Object>} Optimized CV content
     */
  async optimizeContent(cvData, options = {}) {
    const cleanedData = this._cleanCVData(cvData);

    // DEBUG: Log the data being sent to the optimizer
    logger.info('Optimizer Service - Input Data Check', {
      originalKeys: Object.keys(cvData),
      cleanedKeys: Object.keys(cleanedData),
      hasExperience: !!cleanedData.workExperience?.length,
      hasEducation: !!cleanedData.education?.length,
      hasProjects: !!cleanedData.projects?.length,
      sampleExperience: cleanedData.workExperience?.[0]?.company
    });

    const prompt = this.prompts.optimizer.replace('{{PARSED_CV_JSON}}', JSON.stringify(cleanedData, null, 2));
    const messages = [{ role: 'user', content: prompt }];

    const temperature = options.temperature ? options.temperature : config.ai.models.optimizer.temperature;
    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature,
      model: options.model,
    });

    const optimizedCV = await this.aiService.parseJSONResponse(response);

    // CRITICAL: Verify identity hasn't been hallucinated
    const verifiedCV = this._verifyAndRestoreIdentity(cvData, optimizedCV);

    // Initialize logger for this optimization job
    const cvTitle = cvData.title || cvData.metadata?.originalName || 'Optimized CV';
    const jobId = options.jobId || `opt_${Date.now()}`;
    const cvUniqueId = cvData._id || cvData.id || `temp_${Date.now()}`;

    // Create logger with robust error handling
    try {
      const processingLogger = new CVProcessingLogger(cvUniqueId, cvTitle, jobId);
      await processingLogger.init({
        fileName: 'optimized_content',
        mimeType: 'application/json',
        action: 'optimization'
      });
      await processingLogger.saveAIResponse(response);
      await processingLogger.saveOptimizedContent(verifiedCV);
      await processingLogger.finalizeSuccess({ optimizedSections: Object.keys(verifiedCV) });
      logger.info('Optimization logs saved successfully');
    } catch (logErr) {
      logger.warn('Failed to save optimization logs', { error: logErr.message });
    }

    return verifiedCV;
  }

  /**
     * Optimize specific sections of the CV.
     *
     * @param {Object} cvData - Parsed CV data
     * @param {string[]} sections - Sections to optimize
     * @param {Object} options - Optimization options
     * @returns {Promise<Object>} Partially optimized CV
     */
  async optimizeSections(cvData, sections = ['experience', 'summary'], options = {}) {
    // Create a focused prompt for specific sections
    // Note: We might need the whole CV for context, but usually section-specific 
    // optimization performs better with focused context. 
    // For now, passing cleaned full CV but asking for specific sections is safer for context.
    const cleanedData = this._cleanCVData(cvData);

    const sectionPrompt = `Optimize the following CV sections: ${sections.join(', ')}.

CRITICAL RULES:
- Do NOT invent new information
- Preserve all factual details exactly
- Only improve wording and structure
- Return the SAME JSON schema
- Do NOT add or remove fields

CV DATA:
${JSON.stringify(cleanedData, null, 2)}

Return ONLY valid JSON with optimized content.`;

    const messages = [{ role: 'user', content: sectionPrompt }];

    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature: 0.2, // Lower temperature for focused optimization
      model: options.model,
    });

    return await this.aiService.parseJSONResponse(response);
  }

  /**
   * Enhance CV for specific job applications using a 2-phase "Chain of Thought" strategy.
   * Phase 1: Strategic Gap Analysis
   * Phase 2: Content Rewrite & Tailoring
   * 
   * @param {Object} cvData - Parsed CV data
   * @param {Object} jobData - Job description data
   * @param {Object} options - Enhancement options
   * @returns {Promise<Object>} Job-tailored CV and analysis
   */
  async tailorForJob(cvData, jobData, options = {}) {
    logger.info('Starting CV tailoring with COT strategy');

    // Step 1: Analyze alignment (Strategic Analysis)
    logger.info('TailorForJob - Starting Analysis', {
      jobTitle: jobData.title,
      cvId: cvData._id || cvData.id
    });
    const analysis = await this._analyzeAlignment(cvData, jobData, options);

    // Step 2: Rewrite content based on analysis
    // Step 2: Rewrite content based on analysis
    const tailoredCV = await this._rewriteContent(cvData, jobData, analysis, options);

    // CRITICAL: Verify identity hasn't been hallucinated
    const verifiedCV = this._verifyAndRestoreIdentity(cvData, tailoredCV);

    // Initialize logger for this tailoring job
    const cvTitle = cvData.title || cvData.metadata?.originalName || 'Tailored CV';
    const jobId = options.jobId || `tailor_${Date.now()}`;
    const cvUniqueId = cvData._id || cvData.id || `temp_${Date.now()}`;

    const processingLogger = new CVProcessingLogger(cvUniqueId, cvTitle, jobId);

    try {
      await processingLogger.init({
        fileName: 'tailored_content',
        mimeType: 'application/json',
        action: 'tailoring',
        jobTitle: jobData.title
      });

      // Save analysis as separate file
      await processingLogger.saveFile('analysis.json', analysis);
      await processingLogger.saveOptimizedContent(verifiedCV);
      await processingLogger.finalizeSuccess({ tailoredSections: Object.keys(verifiedCV) });
      logger.info('Tailoring logs saved successfully');
    } catch (logErr) {
      logger.warn('Failed to save tailoring logs', { error: logErr.message });
    }

    return verifiedCV;
  }

  /**
   * Phase 1: Analyze alignment between CV and Job
   * @private
   */
  async _analyzeAlignment(cvData, jobData, options) {
    let prompt = this.prompts.analysis;

    // Safety check
    if (!prompt) {
      logger.warn('Analysis prompt not found, skipping analysis phase');
      return {};
    }

    const cleanedData = this._cleanCVData(cvData);

    const jobRequirements = jobData.requirements
      ? jobData.requirements.join(', ')
      : (jobData.description ? jobData.description.substring(0, 1000) : '');

    // Dynamic replacement
    prompt = prompt.replace('{{JOB_TITLE}}', jobData.title || 'Unknown')
      .replace('{{JOB_COMPANY}}', jobData.company || 'Unknown')
      .replace('{{JOB_REQUIREMENTS}}', jobRequirements)
      .replace('{{CV_JSON}}', JSON.stringify(cleanedData, null, 2));

    const messages = [{ role: 'user', content: prompt }];

    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature: 0.2, // Low temp for analytical precision
      model: options.model,
    });

    return await this.aiService.parseJSONResponse(response);
  }

  /**
   * Phase 2: Rewrite content based on analysis
   * @private
   */
  async _rewriteContent(cvData, jobData, analysis, options) {
    let prompt = this.prompts.tailoring;

    // Safety check
    if (!prompt) return cvData;

    const cleanedData = this._cleanCVData(cvData);

    // DEBUG: Log tailoring input
    logger.info('TailorForJob - Rewriting Content', {
      analysisKeys: Object.keys(analysis || {}),
      hasCVData: !!cleanedData.workExperience
    });

    const jobRequirements = jobData.requirements
      ? jobData.requirements.join(', ')
      : (jobData.description ? jobData.description.substring(0, 500) : '');

    // Dynamic replacement
    prompt = prompt.replace('{{JOB_TITLE}}', jobData.title || 'Unknown')
      .replace('{{JOB_COMPANY}}', jobData.company || 'Unknown')
      .replace('{{JOB_REQUIREMENTS}}', jobRequirements)
      .replace('{{ANALYSIS_JSON}}', JSON.stringify(analysis || {}, null, 2))
      .replace('{{CV_JSON}}', JSON.stringify(cleanedData, null, 2));

    const messages = [{ role: 'user', content: prompt }];

    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature: 0.4, // Balanced creativity for writing
      model: options.model,
    });

    return await this.aiService.parseJSONResponse(response);
  }

  /**
     * Get optimization capabilities and supported operations.
     */
  getCapabilities() {
    return {
      operations: ['full-optimization', 'section-optimization', 'job-tailoring'],
      supportedSections: ['personal', 'summary', 'experience', 'education', 'skills', 'projects'],
      aiProvider: this.aiService.getProviderName(),
      optimizationTypes: ['ats-compatibility', 'readability', 'impact', 'keyword-optimization'],
      strategies: ['multi-phase-cot'],
    };
  }
}

module.exports = CVOptimizerService;
