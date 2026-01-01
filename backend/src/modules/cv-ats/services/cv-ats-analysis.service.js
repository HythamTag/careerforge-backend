/**
 * CV ATS ANALYSIS SERVICE
 *
 * Handles AI-powered CV ATS (Applicant Tracking System) analysis.
 * Evaluates CV compatibility with job requirements and provides feedback.
 *
 * @module modules/cv-ats/services/cv-ats-analysis.service
 */

const fs = require('fs');
const path = require('path');
const logger = require('@utils/logger');
const { ErrorFactory } = require('@errors');

class CvAtsAnalysisService {
  /**
     * Create CV ATS analysis service.
     *
     * @param {AIService} aiService - AI service for making API calls
     */
  constructor(aiService) {
    this.aiService = aiService;
    this.promptTemplate = this._loadPromptTemplate();
  }

  /**
     * Load ATS feedback prompt template.
     *
     * @private
     */
  _loadPromptTemplate() {
    const promptPath = path.join(__dirname, '../../../shared/external/ai/prompts/ats/ats-feedback.prompt.txt');

    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (err) {
      logger.error('Failed to load ATS prompt', { error: err.message });
      throw ErrorFactory.internalError('Failed to load ATS analysis configuration');
    }
  }

  /**
     * Evaluate CV against ATS criteria.
     *
     * @param {Object} cvData - Parsed CV data
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} ATS analysis results
     */
  async evaluateCV(cvData, options = {}) {
    const prompt = this.promptTemplate.replace('{{PARSED_CV_JSON}}', JSON.stringify(cvData, null, 2));
    const messages = [{ role: 'user', content: prompt }];

    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature: 0.3, // Consistent analysis
      model: options.model,
    });

    return await this.aiService.parseJSONResponse(response);
  }

  /**
     * Analyze job requirements compatibility.
     *
     * @param {Object} cvData - Parsed CV data
     * @param {Object} jobData - Job requirements
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Job compatibility analysis
     */
  async analyzeJobCompatibility(cvData, jobData, options = {}) {
    // Enhanced prompt for job-specific analysis
    const jobPrompt = `Analyze this CV for compatibility with the following job:

JOB DETAILS:
${JSON.stringify(jobData, null, 2)}

CV DATA:
${JSON.stringify(cvData, null, 2)}

Provide a detailed analysis of how well this candidate matches the job requirements. Include:
- Overall compatibility score (0-100)
- Key matching qualifications
- Missing critical skills/experience
- ATS keyword coverage
- Specific recommendations for improvement

Return the analysis as JSON with the following structure:
{
  "overallScore": number,
  "keywordMatch": number,
  "experienceMatch": number,
  "skillsMatch": number,
  "breakdown": {
    "structure": number (0-40),
    "skills": number (0-25),
    "experience": number (0-25),
    "formatting": number (0-10)
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingRequirements": ["string"],
  "recommendations": ["string"],
  "atsReadiness": "string"
}`;

    const messages = [{ role: 'user', content: jobPrompt }];

    const response = await this.aiService.callAI(messages, {
      format: 'json',
      temperature: 0.2, // Lower temperature for analysis
      model: options.model,
    });

    return await this.aiService.parseJSONResponse(response);
  }

  /**
     * Get ATS analysis capabilities.
     */
  getCapabilities() {
    return {
      analysisTypes: ['general-ats', 'job-compatibility'],
      scoringMetrics: ['keyword-coverage', 'experience-match', 'skills-match'],
      outputFormat: 'structured-json',
      aiProvider: this.aiService.getProviderName(),
    };
  }
}

module.exports = CvAtsAnalysisService;

