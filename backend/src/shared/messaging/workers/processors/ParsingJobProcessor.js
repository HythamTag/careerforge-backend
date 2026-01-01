/**
 * PARSING JOB PROCESSOR
 *
 * Handles CV parsing jobs in the background.
 * Processes uploaded files and extracts structured data.
 *
 * @module workers/processors/ParsingJobProcessor
 */

const BaseProcessor = require('./BaseProcessor');
const CVProcessingLogger = require('./CVProcessingLogger');
const { parseDocx } = require('@modules/cv-parsing/strategies/docx-parser.strategy');
const config = require('@config');
const fs = require('fs').promises;
const { NotFoundError, ValidationError } = require('@errors');
const { ERROR_CODES, PROGRESS_MILESTONES, CV_STATUS } = require('@constants');

class ParsingJobProcessor extends BaseProcessor {
  /**
   * Get required dependencies.
   *
   * @returns {Array<string>} Required dependency names
   */
  getRequiredDependencies() {
    return [
      ...super.getRequiredDependencies(),
      'cvRepository',
      'fileService',
      'pdfService',
      'textCleanerService',
      'cvParsingService',
    ];
  }

  /**
   * Execute parsing job processing logic.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   */
  async execute(jobId, data, job) {
    return await this.cvParsingService.processParsingJob(jobId, data, job);
  }

  /**
   * Handle final failure after all retries exhausted.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Error} error - Final error
   */
  async onFinalFailure(jobId, data, error) {
    const { cvId, jobId: parsingJobId } = data;

    // In case data.jobId is available (from BullMQ data object)
    const idToUse = parsingJobId || jobId;

    // Update CV parsing status
    if (cvId) {
      await this.cvRepository.updateById(cvId, {
        parsingStatus: CV_STATUS.FAILED,
        parsingError: error.message,
        failedAt: new Date(),
      }).catch(err => this.logger.error('Failed to update CV status', {
        error: err.message,
        cvId,
      }));
    }

    // Fail the parsing job record too
    if (idToUse) {
      try {
        const { resolve } = require('@core/container');
        const cvParsingRepository = resolve('cvParsingRepository');
        await cvParsingRepository.failJob(idToUse, error);
      } catch (repoError) {
        this.logger.error('Failed to mark parsing job as failed in repository', { error: repoError.message });
      }
    }
  }
}

module.exports = ParsingJobProcessor;

