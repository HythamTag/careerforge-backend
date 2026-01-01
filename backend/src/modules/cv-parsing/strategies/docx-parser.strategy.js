/**
 * DOCX PARSER STRATEGY
 *
 * Parses Microsoft Word documents to extract text content and structure.
 *
 * @module modules/cv-parsing/strategies/docx-parser.strategy
 */

const BaseParserStrategy = require('./base-parser.strategy');

class DOCXParserStrategy extends BaseParserStrategy {
  get name() {
    return 'docx-parser';
  }

  get supportedTypes() {
    return [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
  }

  /**
     * Parse DOCX file to extract text content and structure.
     * 
     * @param {string} filePath - Path to the DOCX file
     * @param {object} options - Parsing options
     * @returns {Promise<object>} Parsed content with structure
     * 
     * @note PLACEHOLDER IMPLEMENTATION: This is a placeholder strategy.
     * Actual DOCX parsing is currently handled by workers/processors.
     * This strategy should be implemented for direct parsing use cases.
     * 
     * @todo Implement DOCX parsing logic:
     * - Use mammoth, docx4js, or similar library
     * - Extract text content, formatting, structure
     * - Handle tables, lists, headings
     * - Preserve document structure
     */
  async parse(filePath, options = {}) {
    // Current parsing is handled by ParseJobProcessor in workers
    return {
      content: 'DOCX content placeholder - implement actual parsing',
      metadata: {
        author: 'Unknown',
        lastModified: new Date(),
        wordCount: 0,
      },
      structure: {
        sections: [],
        experience: [],
        education: [],
        skills: [],
      },
      extractedAt: new Date(),
      strategy: this.name,
    };
  }

  async extractText(parsedData) {
    return parsedData.content;
  }
}

module.exports = DOCXParserStrategy;
