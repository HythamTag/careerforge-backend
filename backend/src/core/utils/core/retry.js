const logger = require('@utils/logger');
const config = require('@config');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: from config)
 * @param {number} initialDelay - Initial delay in ms (default: from config)
 */
async function retryWithBackoff(fn, maxRetries, initialDelay) {
  if (maxRetries === undefined) {maxRetries = config.external.retryPolicy.maxRetries;}
  if (initialDelay === undefined) {initialDelay = config.external.retryPolicy.initialDelay;}
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${error.message}`, {
          operation: 'Retry',
          attempt: attempt + 1,
          maxRetries,
          delay,
        });
        await sleep(delay);
      } else {
        // All retries exhausted - log the final error
        logger.error(`All ${maxRetries + 1} attempts failed: ${error.message}`, {
          operation: 'Retry exhausted',
          totalAttempts: attempt + 1,
          errorCode: error.code,
          errorStatus: error.statusCode ? error.statusCode : error.status,
        });
      }
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  retryWithBackoff,
};

