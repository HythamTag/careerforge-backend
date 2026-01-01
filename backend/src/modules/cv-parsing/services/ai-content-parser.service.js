/**
 * AI CONTENT PARSER SERVICE
 *
 * Handles AI-powered CV content parsing and extraction.
 * Uses multipass architecture with section-specific AI parsing.
 *
 * @module modules/cv-parsing/services/ai-content-parser.service
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('@utils/logger');
const { ValidationError, AppError } = require('@errors');
const { ERROR_CODES, CV_CONTENT_DEFAULTS, HTTP_STATUS } = require('@constants');
const config = require('@config');

class AIContentParserService {
  /**
   * Create AI content parser service
   *
   * @param {AIService} aiService - AI service for making API calls
   */
  constructor(aiService) {
    if (!aiService) {
      throw new AppError(
        'AIService is required',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DEPENDENCY_MISSING
      );
    }

    this.aiService = aiService;
    this.prompts = null;
    this.promptsLoaded = false;
  }

  /**
   * Initialize service by loading prompts
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.promptsLoaded) return;

    try {
      this.prompts = await this._loadPromptTemplates();
      this.promptsLoaded = true;
      logger.info('AI content parser service initialized', {
        promptsLoaded: Object.keys(this.prompts).length,
      });
    } catch (error) {
      logger.error('Failed to initialize AI content parser service', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load all prompt templates from disk
   *
   * @private
   * @returns {Promise<Object>} Loaded prompts
   */
  async _loadPromptTemplates() {
    const promptsDir = path.join(
      __dirname,
      '../../../shared/external/ai/prompts/multipass'
    );

    const promptFiles = {
      chunk_profile: 'chunk.profile.txt',
      chunk_experience: 'chunk.experience.txt',
      chunk_credentials: 'chunk.credentials.txt',
      // unified: 'unified.parser.prompt.txt', // DISABLED to force Chunked Strategy
    };

    const prompts = {};
    const loadPromises = [];

    for (const [key, filename] of Object.entries(promptFiles)) {
      loadPromises.push(
        this._loadPromptFile(path.join(promptsDir, filename))
          .then(content => {
            prompts[key] = content;
          })
          .catch(err => {
            logger.warn(`Failed to load prompt: ${filename}`, {
              error: err.message
            });
            prompts[key] = null;
          })
      );
    }

    await Promise.all(loadPromises);

    // Profile prompt is required
    if (!prompts.chunk_profile) {
      throw new ValidationError(
        'Profile parser prompt is required but failed to load',
        ERROR_CODES.CONFIGURATION_ERROR
      );
    }

    logger.info('Prompt templates loaded', {
      loaded: Object.keys(prompts).filter(k => prompts[k]).length,
      failed: Object.keys(prompts).filter(k => !prompts[k]).length,
    });

    return prompts;
  }

  /**
   * Load a single prompt file
   * 
   * @private
   * @param {string} filePath - Path to prompt file
   * @returns {Promise<string>} Prompt content
   */
  async _loadPromptFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.trim();
    } catch (error) {
      logger.error('Failed to load prompt file', {
        error: error.message,
        filePath
      });
      throw error;
    }
  }

  /**
   * Parse CV content using section-specific AI parsing
   *
   * @param {string} text - Full CV text content
   * @param {Object} sections - Pre-split sections (optional)
   * @param {Object} options - Parsing options (including processingLogger)
   * @returns {Promise<Object>} Parsed CV data
   */
  async parseContent(text, sections = {}, options = {}) {
    const { onProgress, processingLogger } = options;

    // Ensure prompts are loaded
    if (!this.promptsLoaded) {
      await this.initialize();
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new ValidationError(
        'CV text content is required',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    logger.info('Starting multipass CV parsing', {
      textLength: text.length,
      hasSections: Object.keys(sections).length > 0,
    });

    const startTime = Date.now();

    try {
      // Extract sections if not provided
      if (onProgress) onProgress(40, 'Extracting CV sections...');
      const sectionTexts = this._hasSections(sections)
        ? sections
        : await this._extractSections(text);


      // CHUNKED PARALLEL STRATEGY (High Accuracy + Speed)
      if (this.prompts.chunk_profile) {
        if (onProgress) onProgress(50, 'Parsing CV in parallel chunks...');
        logger.info('Starting Chunked Parallel Parsing (3 concurrent requests)');

        const chunkedResult = await this._parseCV_Chunked(text, processingLogger);

        const processingTime = Date.now() - startTime;
        logger.info('Chunked CV parsing complete', {
          processingTime,
          sectionsFound: Object.keys(chunkedResult.parsedContent).filter(k => {
            const v = chunkedResult.parsedContent[k];
            return v && (Array.isArray(v) ? v.length > 0 : Object.keys(v || {}).length > 0);
          }).length
        });

        return {
          ...chunkedResult,
          metadata: {
            processingTime,
            sectionsProcessed: 8,
            method: 'chunked-parallel'
          }
        };
      }
    } catch (error) {
      logger.error('CV parsing failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Parse CV using 3 parallel chunks
   * @private
   */
  async _parseCV_Chunked(text, processingLogger) {
    // Define chunks
    const chunks = [
      { name: 'chunk_profile', placeholder: '{{cvText}}' },
      { name: 'chunk_experience', placeholder: '{{cvText}}' },
      { name: 'chunk_credentials', placeholder: '{{cvText}}' }
    ];

    // Execute in parallel
    const results = await Promise.all(
      chunks.map(chunk => this._parseSection(chunk.name, text, chunk.placeholder, processingLogger))
    );

    // Merge Results
    return {
      rawResponse: JSON.stringify(results), // Store array of raw responses
      parsedContent: this._mergeChunkedResults(results)
    };
  }

  /**
   * Merge results from chunks
   * @private
   */
  _mergeChunkedResults(results) {
    const [profile, experience, credentials] = results;

    const merged = {
      title: CV_CONTENT_DEFAULTS.TITLE,
      template: CV_CONTENT_DEFAULTS.TEMPLATE,

      // from Profile Chunk
      personalInfo: profile?.personalInfo || { firstName: '', lastName: '', email: '', phone: '', country: '', links: [] },
      professionalSummary: profile?.professionalSummary || '',
      education: profile?.education || [],
      languages: profile?.languages || [],

      // from Experience Chunk
      workExperience: experience?.workExperience || [],
      projects: experience?.projects || [],

      // from Credentials Chunk
      skills: credentials?.skills || [],
      certifications: credentials?.certifications || [],
      publications: credentials?.publications || [],
      volunteer: credentials?.volunteer || [] // optional
    };

    // Ensure arrays
    ['education', 'languages', 'workExperience', 'projects', 'skills', 'certifications', 'publications'].forEach(key => {
      if (!Array.isArray(merged[key])) merged[key] = [];
    });

    return merged;
  }

  /**
   * Check if sections object has any content
   * 
   * @private
   * @param {Object} sections - Sections object
   * @returns {boolean} True if has sections
   */
  _hasSections(sections) {
    return sections && Object.values(sections).some(v => v && v.trim().length > 0);
  }

  /**
   * Merge parsed results from all sections
   * 
   * @private
   * @param {Object} results - Results from all parsers
   * @returns {Object} Merged content
   */
  _mergeResults(results) {
    const merged = {
      title: CV_CONTENT_DEFAULTS.TITLE,
      template: CV_CONTENT_DEFAULTS.TEMPLATE,
      personalInfo: results.core?.personalInfo || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        links: [],
      },
      professionalSummary: results.core?.professionalSummary || '',
      workExperience: results.experience?.workExperience || [],
      education: results.education?.education || [],
      skills: results.skills?.skills || [],
      projects: results.projects?.projects || [],
      languages: results.languages?.languages || [],
      certifications: results.certifications?.certifications || [],
      publications: results.publications?.publications || [],
    };

    // Ensure all arrays are actual arrays
    ['workExperience', 'education', 'skills', 'projects', 'languages', 'certifications', 'publications'].forEach(key => {
      if (!Array.isArray(merged[key])) {
        merged[key] = [];
      }
    });

    return merged;
  }

  /**
   * Parse a specific section using AI
   *
   * @private
   * @param {string} sectionName - Name of the section to parse
   * @param {string} text - Text content for this section
   * @param {string} placeholder - Placeholder to replace in prompt
   * @param {Object} processingLogger - Optional logger for recording raw responses
   * @returns {Promise<Object|null>} Parsed section data or null on failure
   */
  async _parseSection(sectionName, text, placeholder, processingLogger = null) {
    const promptTemplate = this.prompts[sectionName];

    if (!promptTemplate) {
      logger.warn(`No prompt template for section: ${sectionName}`);
      return null;
    }

    // Skip empty sections
    if (!text || text.trim().length === 0) {
      logger.debug(`Skipping empty section: ${sectionName}`);
      return null;
    }

    const prompt = promptTemplate.replace(placeholder, text);
    const messages = [{ role: 'user', content: prompt }];

    try {
      logger.debug(`Parsing section: ${sectionName}`, {
        textLength: text.length,
      });

      const rawResponse = await this.aiService.callAI(messages, {
        format: 'json',
        model: config.ai?.models?.parser?.ollama, // Explicitly use configured parser model (gemma2:2b)
        temperature: config.ai?.models?.parser?.temperature || 0.3,
        maxTokens: config.ai?.models?.parser?.maxTokens || 4000,
      });

      // Log raw response if logger provided
      if (processingLogger && processingLogger.saveMultipassResponse) {
        await processingLogger.saveMultipassResponse(sectionName, rawResponse);
      }

      const parsed = await this.aiService.parseJSONResponse(rawResponse);

      logger.debug(`Section parsed successfully: ${sectionName}`, {
        hasContent: !!parsed,
      });

      return parsed;
    } catch (error) {
      logger.error(`Section parse failed: ${sectionName}`, {
        error: error.message,
        errorType: error.constructor.name,
        errorCode: error.code || error.status,
        section: sectionName,
        textLength: text.length,
        // Include stack for debugging if it's an unexpected error
        stack: error.isOperational ? undefined : error.stack
      });
      return null;
    }
  }

  /**
   * Extract sections from full CV text using regex patterns
   *
   * @private
   * @param {string} fullText - Complete CV text
   * @returns {Promise<Object>} Extracted sections
   */
  async _extractSections(fullText) {
    logger.debug('Extracting sections from CV text', {
      textLength: fullText.length,
    });

    const sections = {
      experience: this._extractSectionByKeywords(fullText, [
        'experience',
        'work experience',
        'employment',
        'professional experience',
        'work history',
        'career history',
        'job history',
        'employment history',
      ]),
      education: this._extractSectionByKeywords(fullText, [
        'education',
        'academic background',
        'qualifications',
        'degrees',
        'academic qualifications',
        'educational background',
        'academic history',
      ]),
      projects: this._extractSectionByKeywords(fullText, [
        'projects',
        'project experience',
        'personal projects',
        'key projects',
        'technical projects',
        'software projects',
        'portfolio',
      ]),
      certifications: this._extractSectionByKeywords(fullText, [
        'certifications',
        'certificates',
        'professional certifications',
        'technical certifications',
        'certification',
        'licenses',
      ]),
      publications: this._extractSectionByKeywords(fullText, [
        'publications',
        'research papers',
        'papers',
        'journal articles',
        'conference papers',
        'published works',
        'research',
      ]),
      languages: this._extractSectionByKeywords(fullText, [
        'languages',
        'language skills',
        'linguistic skills',
        'language proficiency',
        'foreign languages',
        'spoken languages',
      ]),
    };

    const sectionsFound = Object.keys(sections).filter(
      k => sections[k] && sections[k].length > 0
    );

    logger.debug('Sections extracted', {
      sectionsFound: sectionsFound.length,
      sections: sectionsFound,
    });

    return sections;
  }

  /**
   * Extract a section using keyword matching
   *
   * @private
   * @param {string} text - Full text
   * @param {string[]} keywords - Keywords to search for
   * @returns {string} Extracted section text
   */
  _extractSectionByKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) {
      return '';
    }

    const lines = text.split('\n');
    const keywordPattern = new RegExp(`^\\s*(${keywords.join('|')})\\s*:?\\s*$`, 'i');

    let sectionStart = -1;
    let sectionEnd = -1;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (keywordPattern.test(line)) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) {
      return ''; // Section not found
    }

    // Find section end (next major section or end of document)
    const majorSections = [
      'experience', 'work experience', 'education', 'skills', 'technical skills',
      'projects', 'certifications', 'publications', 'languages', 'references',
      'awards', 'summary', 'objective', 'interests', 'hobbies', 'achievements',
      'courses', 'coursework', 'volunteering', 'links', 'portfolio', 'contact'
    ];

    const majorPattern = new RegExp(`^\\s*(${majorSections.join('|')})\\s*:?\\s*$`, 'i');

    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // New section found (but not within first 2 lines to avoid false positives)
      if (majorPattern.test(line) && i > sectionStart + 2) {
        sectionEnd = i - 1;
        break;
      }
    }

    if (sectionEnd === -1) {
      sectionEnd = lines.length - 1;
    }

    const extracted = lines
      .slice(sectionStart, sectionEnd + 1)
      .join('\n')
      .trim();

    return extracted;
  }

  /**
   * Get parsing statistics and capabilities
   * 
   * @returns {Object} Service capabilities
   */
  getCapabilities() {
    return {
      supportedSections: this.prompts
        ? Object.keys(this.prompts).filter(k => this.prompts[k] !== null)
        : [],
      parsingMethod: 'multipass-ai',
      aiProvider: this.aiService.getProviderName?.() || 'unknown',
      sectionExtraction: 'regex-based',
      initialized: this.promptsLoaded,
    };
  }

  /**
   * Validate service configuration
   * 
   * @returns {boolean} True if properly configured
   */
  isConfigured() {
    return this.promptsLoaded &&
      this.prompts &&
      this.prompts.core !== null;
  }
}

module.exports = AIContentParserService;
