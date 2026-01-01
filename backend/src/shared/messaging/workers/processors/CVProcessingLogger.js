/**
 * CV PROCESSING LOGGER
 *
 * Creates detailed log files for each CV parsing job.
 * Logs are saved to backend/src/logs/cvs/{cvId}_{title}_{timestamp}/
 *
 * Files created:
 * - metadata.json: Basic job metadata
 * - extracted_text.txt: Raw extracted text from the file
 * - parsed_cv.json: Parsed structured content
 * - process.log: Step-by-step processing log
 * - result_success.json or result_failed.json: Final result
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('@utils/logger');
const { STRING_LIMITS } = require('@constants');

class CVProcessingLogger {
  constructor(cvId, cvTitle, jobId) {
    this.cvId = cvId;
    this.jobId = jobId;
    this.startTime = Date.now();
    this.logs = [];

    // Create sanitized folder name
    const sanitizedTitle = (cvTitle || 'untitled')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, STRING_LIMITS.CV_TITLE_PREVIEW_LENGTH);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    this.folderName = `${cvId}_${sanitizedTitle}_${timestamp}`;
    this.folderPath = path.join(
      process.cwd(),
      'logs', 'cvs',
      this.folderName,
    );

    this.initialized = false;
  }

  /**
     * Initialize the log folder
     */
  async init(metadata = {}) {
    try {
      await fs.mkdir(this.folderPath, { recursive: true });

      // Save metadata
      await this.saveFile('metadata.json', {
        cvId: this.cvId,
        jobId: this.jobId,
        originalFileName: metadata.fileName || null,
        mimeType: metadata.mimeType || null,
        fileSize: metadata.fileSize || null,
        createdAt: new Date().toISOString(),
      });

      this.log('INFO', 'Starting CV processing', metadata);
      this.initialized = true;
    } catch (error) {
      logger.logOperationError('CV processing logger initialization', error, { cvId: this.cvId });
    }
  }

  /**
     * Add a log entry
     */
  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    return entry;
  }

  /**
     * Save extracted text
     */
  async saveExtractedText(text) {
    if (!this.initialized) { return; }

    try {
      await this.saveFile('extracted_text.txt', text);
      this.log('INFO', 'Extracted text saved', {
        length: text?.length || 0,
      });
    } catch (error) {
      this.log('ERROR', 'Failed to save extracted text', { error: error.message });
    }
  }

  /**
     * Save parsed content
     */
  async saveParsedContent(parsedContent) {
    if (!this.initialized) { return; }

    try {
      await this.saveFile('parsed_cv.json', parsedContent);
      this.log('INFO', 'Parsed content saved', {
        sections: Object.keys(parsedContent || {}).length,
      });
    } catch (error) {
      this.log('ERROR', 'Failed to save parsed content', { error: error.message });
    }
  }

  /**
     * Save raw AI response
     */
  async saveAIResponse(response) {
    if (!this.initialized) { return; }

    try {
      await this.saveFile('ai_response_raw.txt', response || '(empty response)');
      this.log('INFO', 'Raw AI response saved', {
        length: response?.length || 0,
      });
    } catch (error) {
      this.log('ERROR', 'Failed to save AI response', { error: error.message });
    }
  }

  /**
   * Save a multipass AI response
   */
  async saveMultipassResponse(sectionName, response) {
    if (!this.initialized) return;

    try {
      const fileName = `${sectionName}_ai_raw.txt`;
      await this.saveFile(fileName, response || '(empty response)');
      this.log('INFO', `Raw AI response saved for section: ${sectionName}`, {
        section: sectionName,
        length: response?.length || 0,
      });
    } catch (error) {
      this.log('ERROR', `Failed to save AI response for section: ${sectionName}`, { error: error.message });
    }
  }

  /**
     * Log a processing step
     */
  logStep(stepName, status, details = null) {
    this.log('INFO', `Step: ${stepName} - ${status}`, details);
  }

  /**
     * Finalize with success
     */
  async finalizeSuccess(result = {}) {
    if (!this.initialized) { return; }

    const duration = Date.now() - this.startTime;

    try {
      await this.saveFile('result_success.json', {
        success: true,
        cvId: this.cvId,
        jobId: this.jobId,
        confidence: result.confidence || null,
        dataKeys: result.parsedContent ? Object.keys(result.parsedContent) : [],
        sectionsExtracted: result.sectionsExtracted || 0,
        totalDuration: `${duration}ms`,
      });

      this.log('INFO', 'Processing completed successfully', { duration: `${duration}ms` });
      await this.saveProcessLog();
    } catch (error) {
      logger.logOperationError('CV processing success log finalization', error, { cvId: this.cvId });
    }
  }

  /**
     * Finalize with failure
     */
  async finalizeFailure(error) {
    if (!this.initialized) { return; }

    const duration = Date.now() - this.startTime;

    try {
      await this.saveFile('result_failed.json', {
        success: false,
        cvId: this.cvId,
        jobId: this.jobId,
        error: {
          type: error.constructor?.name || 'Error',
          code: error.code || 'UNKNOWN',
          message: error.message,
          stack: error.stack,
        },
        totalDuration: `${duration}ms`,
      });

      this.log('ERROR', 'Processing failed', {
        error: error.message,
        duration: `${duration}ms`,
      });
      await this.saveProcessLog();
    } catch (err) {
      logger.logOperationError('CV processing failure log finalization', err, { cvId: this.cvId });
    }
  }

  /**
     * Save the process log
     */
  async saveProcessLog() {
    try {
      const logContent = this.logs.map(entry => {
        const dataStr = entry.data ? '\n' + JSON.stringify(entry.data, null, 2) : '';
        return `[${entry.timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
      }).join('\n\n');

      await this.saveFile('process.log', logContent);
    } catch (error) {
      logger.logOperationError('CV processing log save', error, { cvId: this.cvId });
    }
  }

  /**
     * Helper to save a file
     */
  async saveFile(fileName, content) {
    try {
      await fs.mkdir(this.folderPath, { recursive: true });
    } catch (err) {
      // Ignore if exists
    }

    const filePath = path.join(this.folderPath, fileName);
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    await fs.writeFile(filePath, data, 'utf-8');
  }
}

module.exports = CVProcessingLogger;
