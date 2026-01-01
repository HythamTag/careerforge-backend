/**
 * PDF PARSER STRATEGY
 *
 * Parses PDF files to extract text content using pdf-parse.
 *
 * @module modules/cv-parsing/strategies/pdf-parser.strategy
 */

const pdf = require('pdf-parse');
const BaseParserStrategy = require('./base-parser.strategy');
const logger = require('@utils/logger');

class PDFParserStrategy extends BaseParserStrategy {
  get name() {
    return 'pdf-parser';
  }

  get supportedTypes() {
    return ['application/pdf'];
  }

  /**
   * Parse PDF file to extract text content and structure.
   * 
   * @param {Buffer|string} input - File buffer or path
   * @param {object} options - Parsing options
   * @returns {Promise<object>} Parsed content
   */
  async parse(input, options = {}) {
    try {
      logger.debug('Parsing PDF document');

      const buffer = Buffer.isBuffer(input) ? input : await this._readToBuffer(input);

      const data = await pdf(buffer, {
        pagerender: options.pagerender,
        max: options.maxPages || 0,
      });

      return {
        content: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          metadata: data.metadata,
          version: data.version,
        },
        extractedAt: new Date(),
        strategy: this.name,
      };
    } catch (error) {
      logger.error('PDF parsing failed', {
        error: error.message,
        strategy: this.name
      });
      throw error;
    }
  }

  /**
   * Helper to read file to buffer if path provided
   * @private
   */
  async _readToBuffer(filePath) {
    const fs = require('fs').promises;
    return await fs.readFile(filePath);
  }

  async extractText(parsedData) {
    return parsedData.content;
  }
}

module.exports = PDFParserStrategy;
