/**
 * CIRCUIT BREAKER
 *
 * Implements circuit breaker pattern for failure protection.
 * Prevents cascading failures by stopping requests when failure threshold is reached.
 *
 * @module workers/utils/CircuitBreaker
 */

class CircuitBreaker {
  /**
   * Circuit breaker states.
   */
  static STATES = {
    CLOSED: 'closed',      // Normal operation
    OPEN: 'open',          // Failing, reject requests
    HALF_OPEN: 'half_open', // Testing if service recovered
  };

  /**
   * Create circuit breaker.
   *
   * @param {Object} options - Circuit breaker options
   * @param {number} [options.failureThreshold=5] - Number of failures before opening
   * @param {number} [options.resetTimeout=60000] - Time in ms before attempting reset
   * @param {number} [options.monitoringWindow=60000] - Time window for failure counting
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringWindow = options.monitoringWindow || 60000; // 1 minute

    this.state = CircuitBreaker.STATES.CLOSED;
    this.failures = [];
    this.nextAttempt = null;
    this.successCount = 0;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
  }

  /**
   * Execute a function with circuit breaker protection.
   *
   * @param {Function} fn - Function to execute
   * @returns {Promise<*>} Function result
   * @throws {Error} CircuitBreakerOpenError if circuit is open
   */
  async execute(fn) {
    // Check circuit state
    if (this.state === CircuitBreaker.STATES.OPEN) {
      // Check if reset timeout has passed
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitBreaker.STATES.HALF_OPEN;
        this.successCount = 0;
      } else {
        const error = new Error('Circuit breaker is OPEN');
        error.code = 'CIRCUIT_BREAKER_OPEN';
        error.circuitBreaker = {
          state: this.state,
          nextAttempt: new Date(this.nextAttempt),
        };
        throw error;
      }
    }

    try {
      // Execute function
      const result = await fn();

      // Record success
      this.recordSuccess();

      return result;

    } catch (error) {
      // Record failure
      this.recordFailure();

      throw error;
    }
  }

  /**
   * Record a successful execution.
   */
  recordSuccess() {
    // Clear old failures
    this.cleanOldFailures();

    if (this.state === CircuitBreaker.STATES.HALF_OPEN) {
      this.successCount++;
      // If we have enough successes, close the circuit
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.state = CircuitBreaker.STATES.CLOSED;
        this.failures = [];
        this.successCount = 0;
      }
    } else {
      // In closed state, reset failure count on success
      this.failures = [];
    }
  }

  /**
   * Record a failed execution.
   */
  recordFailure() {
    const now = Date.now();
    this.failures.push(now);

    // Clean old failures
    this.cleanOldFailures();

    // Check if we've exceeded threshold
    if (this.failures.length >= this.failureThreshold) {
      if (this.state === CircuitBreaker.STATES.CLOSED) {
        // Open the circuit
        this.state = CircuitBreaker.STATES.OPEN;
        this.nextAttempt = now + this.resetTimeout;
      } else if (this.state === CircuitBreaker.STATES.HALF_OPEN) {
        // Still failing, open again
        this.state = CircuitBreaker.STATES.OPEN;
        this.nextAttempt = now + this.resetTimeout;
        this.successCount = 0;
      }
    }
  }

  /**
   * Remove failures outside the monitoring window.
   */
  cleanOldFailures() {
    const cutoff = Date.now() - this.monitoringWindow;
    this.failures = this.failures.filter(timestamp => timestamp > cutoff);
  }

  /**
   * Get circuit breaker state.
   *
   * @returns {Object} State information
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failures.length,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt) : null,
      successCount: this.successCount,
    };
  }

  /**
   * Reset circuit breaker to closed state.
   */
  reset() {
    this.state = CircuitBreaker.STATES.CLOSED;
    this.failures = [];
    this.nextAttempt = null;
    this.successCount = 0;
  }
}

module.exports = CircuitBreaker;

