/**
 * RETRY STRATEGY
 *
 * Implements retry logic for job processors.
 * Provides exponential backoff, jitter, and retryable error detection.
 *
 * @module workers/utils/RetryStrategy
 */

class RetryStrategy {
  /**
   * Create retry strategy.
   *
   * @param {Object} options - Retry options
   * @param {number} [options.maxRetries=3] - Maximum number of retries
   * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
   * @param {number} [options.maxDelay=30000] - Maximum delay in milliseconds
   * @param {number} [options.multiplier=2] - Exponential backoff multiplier
   * @param {boolean} [options.jitter=true] - Add random jitter to delays
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.multiplier = options.multiplier || 2;
    this.jitter = options.jitter !== false;
  }

  /**
   * Calculate delay for a retry attempt.
   *
   * @param {number} attempt - Current attempt number (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt) {
    // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
    let delay = this.initialDelay * Math.pow(this.multiplier, attempt);

    // Cap at max delay
    delay = Math.min(delay, this.maxDelay);

    // Add jitter (±20% random variation)
    if (this.jitter) {
      const jitterAmount = delay * 0.2;
      const jitter = (Math.random() * 2 - 1) * jitterAmount; // -20% to +20%
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Check if error is retryable.
   *
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    // Network errors
    const networkErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'EAI_AGAIN',
    ];

    if (error.code && networkErrors.includes(error.code)) {
      return true;
    }

    // Rate limiting
    if (error.code === 'RATE_LIMIT' || error.statusCode === 429) {
      return true;
    }

    // Service unavailable
    if (error.code === 'SERVICE_UNAVAILABLE' || error.statusCode === 503) {
      return true;
    }

    // Check error message
    const errorMessage = (error.message || '').toLowerCase();
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'rate limit',
      'service unavailable',
      'temporary',
      'retry',
    ];

    if (retryablePatterns.some(pattern => errorMessage.includes(pattern))) {
      return true;
    }

    // Check if error explicitly marks itself as retryable
    if (error.isRetryable === true) {
      return true;
    }

    // Validation errors and not found errors are not retryable
    if (error.code === 'VALIDATION_ERROR' || error.code === 'NOT_FOUND') {
      return false;
    }

    // Default: not retryable (conservative approach)
    return false;
  }

  /**
   * Execute a function with retry logic.
   *
   * @param {Function} fn - Function to execute
   * @param {Object} [options] - Retry options
   * @param {Function} [options.onRetry] - Callback called before each retry
   * @returns {Promise<*>} Function result
   * @throws {Error} Last error if all retries exhausted
   */
  async executeWithRetry(fn, options = {}) {
    let lastError;
    const onRetry = options.onRetry || (() => {});

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error; // Don't retry non-retryable errors
        }

        // Check if we've exhausted retries
        if (attempt >= this.maxRetries) {
          throw error; // Re-throw last error
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        await onRetry(error, attempt + 1, delay);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for specified milliseconds.
   *
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryStrategy;

