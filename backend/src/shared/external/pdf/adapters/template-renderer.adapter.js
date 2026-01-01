/**
 * TEMPLATE RENDERER ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Rendering templates with data
 * Orchestrates template loading, validation, and compilation
 * 
 * @module modules/generation/infrastructure/adapters/TemplateRenderer
 */

const Handlebars = require('handlebars');
const { logger } = require('@utils');
const { FileError, ValidationError } = require('@errors');
const { TEMPLATES, DEFAULT_CUSTOMIZATION } = require('@constants');

class TemplateRenderer {
  /**
     * @param {TemplateLoader} templateLoader - Template loader instance
     * @param {CustomizationValidator} customizationValidator - Validator instance
     */
  constructor(templateLoader, customizationValidator) {
    this.loader = templateLoader;
    this.validator = customizationValidator;
    this._registerHelpers();
  }

  /**
     * Get list of available templates
     * @returns {Array} Array of template metadata
     */
  getAvailableTemplates() {
    return Object.values(TEMPLATES);
  }

  /**
     * Get template metadata
     * @param {string} templateId - Template identifier
     * @returns {Object} Template metadata
     * @throws {ValidationError} If template not found
     */
  getTemplateMetadata(templateId) {
    const template = TEMPLATES[templateId];
    if (!template) {
      throw new ValidationError(`Invalid template ID: ${templateId}`, 'templateId');
    }
    return template;
  }

  /**
     * Render CV template with data
     * 
     * @param {string} templateId - Template identifier
     * @param {Object} cvData - CV data to render
     * @param {Object} customization - Template customization options
     * @returns {Promise<string>} Rendered HTML
     */
  async render(templateId, cvData, customization = {}) {
    try {
      // Validate template exists
      this.getTemplateMetadata(templateId);

      // Validate customization
      this.validator.validate(customization);

      // Merge customization with defaults
      const mergedCustomization = {
        ...DEFAULT_CUSTOMIZATION,
        ...customization,
      };

      // Load template
      const templateContent = await this.loader.load(templateId);

      // Compile template
      const compiledTemplate = Handlebars.compile(templateContent);

      // Prepare template data
      // Template expects data at root level (personalInfo, workExperience, etc.)
      // So we spread cvData at root, but also keep cv for backward compatibility
      const templateData = {
        ...cvData, // Spread CV data at root level for template access
        cv: cvData, // Keep cv object for backward compatibility
        customization: mergedCustomization,
        meta: TEMPLATES[templateId],
      };

      // Log template data structure for debugging
      logger.debug('Template data prepared', {
        operation: 'Template rendering',
        templateId,
        hasPersonalInfo: !!cvData.personalInfo,
        hasWorkExperience: Array.isArray(cvData.workExperience),
        workExperienceCount: Array.isArray(cvData.workExperience) ? cvData.workExperience.length : 0,
        dataKeys: Object.keys(cvData),
      });

      // Render HTML
      const html = compiledTemplate(templateData);
      
      // Log rendered HTML info
      logger.debug('HTML rendered', {
        operation: 'Template rendering',
        templateId,
        htmlLength: html.length,
        hasBody: html.includes('<body'),
        hasContent: html.length > 1000,
      });

      logger.info('Template rendered successfully', {
        operation: 'Template rendering',
        templateId,
        cvId: cvData._id || 'unknown',
      });

      return html;
    } catch (error) {
      logger.logError(error, {
        operation: 'Template rendering',
        templateId,
      });
      throw new FileError(`Failed to render template: ${error.message}`);
    }
  }

  /**
     * Register Handlebars helpers
     * @private
     */
  _registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date) => {
      if (!date) {return 'Present';}
      if (typeof date === 'string') {return date;}
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    // Join array helper
    Handlebars.registerHelper('join', function (array, options) {
      if (!Array.isArray(array)) {return '';}
      // Handle separator - options is the Handlebars options object, not separator
      const separator = (typeof options === 'string') ? options : ', ';
      // Ensure all items are strings
      return array.map(item => {
        if (typeof item === 'string') {return item;}
        if (typeof item === 'object' && item !== null) {
          return item.name || item.skill || JSON.stringify(item);
        }
        return String(item);
      }).join(separator);
    });

    // Conditional helper for section ordering
    Handlebars.registerHelper('inOrder', function (section, order, options) {
      if (order && order.indexOf(section) !== -1) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }
}

module.exports = TemplateRenderer;


