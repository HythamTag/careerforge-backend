/**
 * GENERATION JOB PROCESSOR
 *
 * Handles CV generation jobs in the background.
 * Processes CV data and generates formatted CV documents.
 *
 * @module workers/processors/GenerationJobProcessor
 */

const BaseProcessor = require('./BaseProcessor');
const fs = require('fs').promises;
const path = require('path');
const { FILE_LIMITS, ERROR_CODES, PROGRESS_MILESTONES, GENERATION_STATUS } = require('@constants');
const { resolve } = require('@core/container');
const { NotFoundError, ValidationError } = require('@errors');

class GenerationJobProcessor extends BaseProcessor {
  /**
   * Get required dependencies.
   *
   * @returns {Array<string>} Required dependency names
   */
  getRequiredDependencies() {
    return [
      ...super.getRequiredDependencies(),
      'generationRepository',
      'generationService',
    ];
  }

  /**
   * Execute generation job processing logic.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   */
  async execute(jobId, data, job) {
    return await this.generationService.processGenerationJob(jobId, data, job);
  }

  /**
   * Handle final failure after all retries exhausted.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Error} error - Final error
   */
  async onFinalFailure(jobId, data, error) {
    const { generationId } = data;

    // Update generation status
    if (generationId) {
      await this.generationService.failGeneration(generationId, {
        code: 'GENERATION_FAILED',
        message: error.message,
        details: error.details || {},
      }).catch(err => this.logger.error('Failed to update generation status', {
        error: err.message,
        generationId,
      }));
    }
  }
}

module.exports = GenerationJobProcessor;

