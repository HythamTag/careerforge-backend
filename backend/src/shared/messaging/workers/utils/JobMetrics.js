/**
 * JOB METRICS
 *
 * Tracks performance metrics for job processors.
 * Records success/failure rates, processing times, and retry counts.
 *
 * @module workers/utils/JobMetrics
 */

class JobMetrics {
  /**
   * Create metrics tracker for a processor.
   *
   * @param {string} processorName - Name of the processor
   */
  constructor(processorName) {
    this.processorName = processorName;
    this.reset();
  }

  /**
   * Reset all metrics.
   */
  reset() {
    this.successCount = 0;
    this.failureCount = 0;
    this.totalProcessingTime = 0;
    this.minProcessingTime = Infinity;
    this.maxProcessingTime = 0;
    this.processingTimes = []; // For percentile calculations
    this.retryCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Record a successful job execution.
   *
   * @param {number} processingTime - Processing time in milliseconds
   */
  recordSuccess(processingTime) {
    this.successCount++;
    this.totalProcessingTime += processingTime;
    this.processingTimes.push(processingTime);

    if (processingTime < this.minProcessingTime) {
      this.minProcessingTime = processingTime;
    }
    if (processingTime > this.maxProcessingTime) {
      this.maxProcessingTime = processingTime;
    }

    // Keep only last 1000 processing times for memory efficiency
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }
  }

  /**
   * Record a failed job execution.
   */
  recordFailure() {
    this.failureCount++;
  }

  /**
   * Record a retry.
   */
  recordRetry() {
    this.retryCount++;
  }

  /**
   * Calculate percentile from processing times.
   *
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(percentile) {
    if (this.processingTimes.length === 0) {
      return 0;
    }

    const sorted = [...this.processingTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get all metrics.
   *
   * @returns {Object} Metrics object
   */
  getMetrics() {
    const totalJobs = this.successCount + this.failureCount;
    const successRate = totalJobs > 0 ? (this.successCount / totalJobs) * 100 : 0;
    const avgProcessingTime = this.successCount > 0
      ? this.totalProcessingTime / this.successCount
      : 0;

    return {
      processorName: this.processorName,
      totalJobs,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: parseFloat(successRate.toFixed(2)),
      retryCount: this.retryCount,
      processingTime: {
        average: Math.round(avgProcessingTime),
        min: this.minProcessingTime === Infinity ? 0 : this.minProcessingTime,
        max: this.maxProcessingTime,
        p50: this.calculatePercentile(50),
        p95: this.calculatePercentile(95),
        p99: this.calculatePercentile(99),
      },
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get metrics summary for logging.
   *
   * @returns {Object} Summary metrics
   */
  getSummary() {
    const metrics = this.getMetrics();
    return {
      processor: metrics.processorName,
      successRate: `${metrics.successRate}%`,
      totalJobs: metrics.totalJobs,
      avgTime: `${metrics.processingTime.average}ms`,
      p95Time: `${metrics.processingTime.p95}ms`,
    };
  }
}

module.exports = JobMetrics;

