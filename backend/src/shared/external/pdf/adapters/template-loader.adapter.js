/**
 * TEMPLATE LOADER ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Loading template files from disk
 * Uses cache for performance
 * 
 * @module modules/generation/infrastructure/adapters/TemplateLoader
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('@utils/logger');
const { FileError } = require('@errors');

class TemplateLoader {
  /**
     * @param {TemplateCache} templateCache - Cache instance
     */
  constructor(templateCache) {
    this.cache = templateCache;
    // From src/shared/external/pdf/adapters/ to src/templates/cv/
    // ../ -> pdf/, ../../ -> external/, ../../../ -> shared/, ../../../../ -> src/
    this.templatesDir = path.join(__dirname, '../../../../templates/cv');
  }

  /**
     * Load template content from file system
     * Uses cache to avoid redundant disk I/O
     * 
     * @param {string} templateId - Template identifier
     * @returns {Promise<string>} Template content
     */
  async load(templateId) {
    // Check cache first
    if (this.cache.has(templateId)) {
      logger.debug('Template loaded from cache', { templateId });
      return this.cache.get(templateId);
    }

    try {
      const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');

      // Cache for future use
      this.cache.set(templateId, templateContent);

      logger.info('Template loaded from disk and cached', {
        operation: 'Template loading',
        templateId,
      });

      return templateContent;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new FileError(`Template file not found: ${templateId}`);
      }
      throw new FileError(`Failed to load template: ${error.message}`);
    }
  }

  /**
     * Check if template file exists
     * @param {string} templateId - Template identifier
     * @returns {Promise<boolean>} True if template exists
     */
  async exists(templateId) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = TemplateLoader;


