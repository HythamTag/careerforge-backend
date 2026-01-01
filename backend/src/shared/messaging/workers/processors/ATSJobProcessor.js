/**
 * ATS JOB PROCESSOR
 *
 * Handles ATS analysis jobs in the background.
 * Processes CV content against job descriptions and provides scoring/feedback.
 *
 * @module workers/processors/ATSJobProcessor
 */

const BaseProcessor = require('./BaseProcessor');
const { NotFoundError } = require('@errors');
const { ERROR_CODES, ATS_STATUS } = require('@constants');

class ATSJobProcessor extends BaseProcessor {
  /**
   * Get required dependencies.
   *
   * @returns {Array<string>} Required dependency names
   */
  getRequiredDependencies() {
    return [
      ...super.getRequiredDependencies(),
      'atsRepository', // Mapped from cvAtsRepository in unified.worker.js
      'cvAtsService',
      'cvAtsAnalysisService',
    ];
  }

  /**
   * Execute ATS analysis job processing logic.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   */
  async execute(jobId, data, job) {
    return await this.cvAtsService.processAtsJob(jobId, data, job);
  }

  /**
   * Handle final failure after all retries exhausted.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Error} error - Final error
   */
  async onFinalFailure(jobId, data, error) {
    const { analysisId } = data;

    // Update analysis record to failed
    if (analysisId) {
      await this.cvAtsService.failAnalysis(analysisId, error)
        .catch(err => this.logger.error('Failed to update ATS analysis status', {
          error: err.message,
          analysisId,
        }));
    }
  }
}

module.exports = ATSJobProcessor;
