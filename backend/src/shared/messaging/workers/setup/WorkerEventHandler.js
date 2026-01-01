/**
 * WORKER EVENT HANDLER
 * 
 * Handles BullMQ worker events (waiting, active, completed, failed, progress).
 * Handles worker event logging and monitoring for all background workers.
 * 
 * @module workers/setup/WorkerEventHandler
 */

const logger = require('@utils/logger');

/**
 * Set up event handlers for a BullMQ worker.
 * 
 * @param {Worker} worker - BullMQ Worker instance
 * @param {string} jobType - Type of job (e.g., "Parse", "Optimize")
 */
function setupWorkerEvents(worker, jobType) {
  worker.on('waiting', (jobId) => {
    logger.debug('Worker waiting for job', {
      operation: 'Worker event',
      jobType,
      jobId,
    });
  });

  worker.on('active', (job) => {
    logger.debug('Worker started job', {
      operation: 'Worker event',
      jobType,
      jobId: job.id,
    });
  });

  worker.on('completed', (job) => {
    logger.info('Job completed', {
      operation: 'Worker event',
      jobType,
      jobId: job.id,
    });
  });

  worker.on('failed', (job, err) => {
    // Only log if error wasn't already logged in the worker function
    if (!err._alreadyLogged) {
      logger.logError(err, {
        operation: 'Worker event',
        jobType,
        jobId: job.id,
        note: 'Unexpected job failure (not logged in worker function)',
      });
    }
  });

  worker.on('progress', (job, progress) => {
    logger.debug('Job progress', {
      operation: 'Worker event',
      jobType,
      jobId: job.id,
      progress: `${progress}%`,
    });
  });
}

module.exports = { setupWorkerEvents };


