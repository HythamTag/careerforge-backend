/**
 * ============================================================================
 * file.constants.js - File Processing Constants (Pure Static)
 * ============================================================================
 */

/**
 * Supported File Types
 * Configuration for each supported document format
 */
const FILE_TYPES = Object.freeze({
  PDF: Object.freeze({
    extension: '.pdf',
    mimeType: 'application/pdf',
    /**
     * Maximum file size: 10MB
     * Standard limit for PDF CV documents
     */
    maxSize: 10 * 1024 * 1024,
  }),
  DOCX: Object.freeze({
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    /**
     * Maximum file size: 10MB
     * Standard limit for DOCX CV documents
     */
    maxSize: 10 * 1024 * 1024,
  }),
  DOC: Object.freeze({
    extension: '.doc',
    mimeType: 'application/msword',
    /**
     * Maximum file size: 10MB
     * Standard limit for legacy DOC format
     */
    maxSize: 10 * 1024 * 1024,
  }),
  TXT: Object.freeze({
    extension: '.txt',
    mimeType: 'text/plain',
    /**
     * Maximum file size: 5MB
     * Text files are typically smaller, lower limit
     */
    maxSize: 5 * 1024 * 1024,
  }),
});

/**
 * File Processing Limits
 * Constraints for file operations and storage
 */
const FILE_LIMITS = Object.freeze({
  /**
   * Maximum file size: 10MB
   * Prevents memory issues and ensures reasonable upload times
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /**
   * Maximum files per batch upload
   * 10 files - prevents timeout and resource exhaustion
   */
  MAX_FILES_PER_UPLOAD: 10,

  /**
   * Maximum pages per document
   * 20 pages - CVs are typically 1-3 pages, this is a safety limit
   */
  MAX_PAGES_PER_DOCUMENT: 20,

  /**
   * Minimum file size: 100 bytes
   * Filters out empty or corrupted files
   */
  MIN_FILE_SIZE: 100,

  /**
   * Maximum storage per user: 100MB
   * Reasonable limit for CV document storage
   */
  MAX_STORAGE_PER_USER: 100 * 1024 * 1024,

  /**
   * Maximum size for generated files: 50MB
   * Generated PDFs can be larger than uploaded files
   */
  MAX_GENERATED_FILE_SIZE: 50 * 1024 * 1024,

  /**
   * Text extraction timeout: 30 seconds
   * Prevents hanging on corrupted or complex documents
   */
  TEXT_EXTRACTION_TIMEOUT_MS: 30000,

  /**
   * Document generation timeout: 60 seconds
   * Allows time for complex PDF generation
   */
  DOCUMENT_GENERATION_TIMEOUT_MS: 60000,

  /**
   * Average words per page estimates
   * Used for progress estimation and validation
   */
  WORDS_PER_PAGE: Object.freeze({
    /**
     * PDF: 400 words per page
     * Typical for formatted PDF documents
     */
    PDF: 400,

    /**
     * DOCX: 350 words per page
     * Slightly less dense than PDF due to formatting
     */
    DOCX: 350,
  }),
});

/**
 * PDF Processing Configuration
 * Settings for PDF text extraction and processing
 */
const PDF_PROCESSING_CONFIG = Object.freeze({
  /**
   * Maximum time to wait for text extraction (30 seconds)
   * Prevents hanging on corrupted or complex PDFs
   */
  TEXT_EXTRACTION_TIMEOUT: 30000,

  /**
   * Minimum text length to consider valid extraction
   * 100 characters - filters out empty or corrupted extractions
   */
  MIN_TEXT_LENGTH: 100,

  /**
   * Context window for JSON parsing errors
   * 50 characters - enough context for debugging parse errors
   */
  JSON_PARSE_CONTEXT_WINDOW: 50,
});

/**
 * Storage Backend Types
 * Available storage providers
 */
const STORAGE_TYPES = Object.freeze({
  LOCAL: 'local',
  S3: 's3',
  BOTH: 'both',
});

/**
 * Document Formatting Constants
 * Formatting parameters for document generation
 * Values are in twips (1/20th of a point) for DOCX, points for PDF
 */
const DOCUMENT_FORMATTING = Object.freeze({
  /**
   * DOCX spacing after paragraph: 200 twips
   * Standard paragraph spacing
   */
  DOCX_SPACING_AFTER: 200,

  /**
   * DOCX left indent: 400 twips
   * Standard bullet point indentation
   */
  DOCX_INDENT_LEFT: 400,

  /**
   * PDF margin: 50 points
   * Standard page margin
   */
  PDF_MARGIN: 50,

  /**
   * Normal font size: 12 points
   * Standard body text size
   */
  FONT_SIZE_NORMAL: 12,

  /**
   * Heading font size: 16 points
   * Section heading size
   */
  FONT_SIZE_HEADING: 16,
});

/**
 * Text Processing Configuration
 * Settings for text cleaning and validation
 */
const TEXT_PROCESSING = Object.freeze({
  /**
   * Minimum paragraph length: 50 characters
   * Filters out fragments and incomplete sentences
   */
  MIN_PARAGRAPH_LENGTH: 50,

  /**
   * Maximum paragraph length: 500 characters
   * Prevents overly long paragraphs
   */
  MAX_PARAGRAPH_LENGTH: 500,

  /**
   * Minimum cleaned text length: 100 characters
   * Ensures meaningful content after cleaning
   */
  MIN_CLEANED_LENGTH: 100,

  /**
   * Unicode invisible characters regex
   * Matches zero-width spaces and other invisible Unicode characters
   * Used to clean text extracted from documents
   */
  UNICODE_INVISIBLE_CHARS: /[\u200B-\u200D\uFEFF]/g,
});

/**
 * Derived Constants
 */
const ALLOWED_EXTENSIONS = Object.freeze(
  Object.values(FILE_TYPES).map(type => type.extension),
);

const ALLOWED_MIME_TYPES = Object.freeze(
  Object.values(FILE_TYPES).map(type => type.mimeType),
);

module.exports = {
  FILE_TYPES,
  FILE_LIMITS,
  PDF_PROCESSING_CONFIG,
  STORAGE_TYPES,
  DOCUMENT_FORMATTING,
  TEXT_PROCESSING,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
