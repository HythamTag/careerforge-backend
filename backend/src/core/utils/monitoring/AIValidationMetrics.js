/**
 * AI VALIDATION METRICS
 * 
 * Tracks schema validation failures to help improve prompts.
 */

class AIValidationMetrics {
  constructor() {
    this.errors = {};
    this.totalErrors = 0;
  }

  /**
     * Record validation errors from ajv.
     * 
     * @param {Array} errors - Array of validation errors from ajv
     */
  recordValidationErrors(errors) {
    if (!Array.isArray(errors)) {
      return;
    }

    for (const error of errors) {
      const key = `${error.instancePath || 'root'}::${error.message}`;
      this.errors[key] = (this.errors[key] || 0) + 1;
      this.totalErrors++;
    }
  }

  /**
     * Get snapshot of current metrics.
     * 
     * @returns {Object} Metrics snapshot
     */
  snapshot() {
    return {
      total: this.totalErrors,
      unique: Object.keys(this.errors).length,
      byType: { ...this.errors },
    };
  }

  /**
     * Reset all metrics.
     */
  reset() {
    this.errors = {};
    this.totalErrors = 0;
  }
}

module.exports = AIValidationMetrics;

