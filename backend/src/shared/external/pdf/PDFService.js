/**
 * PDF SERVICE
 * 
 * Handles PDF operations with proper error handling and validation
 * 
 * @module shared/external/pdf/PDFService
 */

const pdfParse = require('pdf-parse');
const { FileError, ValidationError } = require('@errors');
const { FILE_LIMITS, ERROR_CODES } = require('@constants');

class PDFService {
  constructor(config, logger, validator) {
    this.config = config;
    this.logger = logger;
    this.validator = validator;
    this.maxPages = config?.fileLimits?.maxPages || FILE_LIMITS.MAX_PAGES_PER_DOCUMENT;
    this.maxSize = config?.fileLimits?.maxSize || FILE_LIMITS.MAX_FILE_SIZE;
  }

  /**
   * Extract text from PDF buffer
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractText(fileBuffer) {
    // Validate input
    this.validator.validateBuffer(fileBuffer);
    this.validator.validateHeader(fileBuffer);

    try {
      const data = await pdfParse(fileBuffer, {
        max: this.maxPages,
      });

      // Check page limit
      if (data.numpages > this.maxPages) {
        this.logger.warn('PDF page limit exceeded', {
          operation: 'PDFExtraction',
          pages: data.numpages,
          maxPages: this.maxPages,
        });
      }

      const result = {
        text: data.text,
        pages: data.numpages,
        metadata: this.extractMetadata(data.info),
        stats: {
          words: this.countWords(data.text),
          characters: data.text.length,
          extractedAt: new Date().toISOString(),
        },
      };

      this.logger.info('Text extracted from PDF', {
        operation: 'PDFExtraction',
        pages: result.pages,
        words: result.stats.words,
      });

      return result;
    } catch (error) {
      this.logger.error('PDF extraction failed', {
        operation: 'PDFExtraction',
        error: error.message,
        bufferSize: fileBuffer.length,
      });
      
      if (error.message.includes('Invalid PDF') || error.message.includes('PDF')) {
        throw new ValidationError('Invalid PDF file format', ERROR_CODES.CV_INVALID_FORMAT);
      }
      
      throw new FileError(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Validate PDF file
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<Object>} Validation result
   */
  async validate(fileBuffer) {
    try {
      this.validator.validateBuffer(fileBuffer);
      this.validator.validateHeader(fileBuffer);

      // Try to parse
      const data = await pdfParse(fileBuffer, { max: 1 });
      
      this.validator.validatePageCount(data.numpages);

      return {
        valid: true,
        version: this.extractPDFVersion(fileBuffer.slice(0, 5).toString('utf8')),
        pages: data.numpages,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new FileError(`PDF validation failed: ${error.message}`);
    }
  }

  /**
   * Get PDF metadata without extracting text
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Promise<Object>} PDF metadata
   */
  async getMetadata(fileBuffer) {
    this.validator.validateBuffer(fileBuffer);

    try {
      const data = await pdfParse(fileBuffer, {
        max: 0, // Don't extract text
      });

      return {
        pages: data.numpages,
        ...this.extractMetadata(data.info),
      };
    } catch (error) {
      throw new FileError(`Failed to get PDF metadata: ${error.message}`);
    }
  }

  // Helper methods

  extractMetadata(info) {
    if (!info) return {};

    return {
      title: info.Title || null,
      author: info.Author || null,
      creator: info.Creator || null,
      producer: info.Producer || null,
      creationDate: this.parseDate(info.CreationDate),
      modificationDate: this.parseDate(info.ModDate),
    };
  }

  parseDate(pdfDate) {
    if (!pdfDate) return null;
    try {
      // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
      if (typeof pdfDate === 'string' && pdfDate.startsWith('D:')) {
        const dateStr = pdfDate.substring(2, 16);
        return new Date(
          dateStr.substring(0, 4), // year
          parseInt(dateStr.substring(4, 6)) - 1, // month
          dateStr.substring(6, 8), // day
          dateStr.substring(8, 10), // hour
          dateStr.substring(10, 12), // minute
          dateStr.substring(12, 14) // second
        ).toISOString();
      }
      return null;
    } catch {
      return null;
    }
  }

  extractPDFVersion(header) {
    const match = header.match(/%PDF-(\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = PDFService;
