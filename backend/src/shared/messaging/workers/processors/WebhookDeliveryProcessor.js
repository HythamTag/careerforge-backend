/**
 * WEBHOOK DELIVERY PROCESSOR
 *
 * Handles webhook delivery jobs in the background.
 * Processes webhook events and delivers them to configured endpoints.
 *
 * @module workers/processors/WebhookDeliveryProcessor
 */

const BaseProcessor = require('./BaseProcessor');
const { NUMERIC_LIMITS, CLEANUP, WEBHOOK, ERROR_CODES, JOB_STATUS, WEBHOOK_DELIVERY_STATUS, OPERATION_STATUS } = require('@constants');
const { NotFoundError, ErrorFactory } = require('@errors');

class WebhookDeliveryProcessor extends BaseProcessor {
  /**
   * Get required dependencies.
   *
   * @returns {Array<string>} Required dependency names
   */
  getRequiredDependencies() {
    return [
      ...super.getRequiredDependencies(),
      'webhookRepository',
      'webhookService',
    ];
  }

  /**
   * Execute webhook delivery job processing logic.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Object} job - BullMQ job object
   * @returns {Promise<Object>} Processing result
   */
  async execute(jobId, data, job) {
    return await this.webhookService.processDeliveryJob(jobId, data, job);
  }

  /**
   * Determine if error is retryable for webhooks.
   * Webhooks should retry on network errors and 5xx status codes.
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (super.isRetryableError(error)) {
      return true;
    }

    // 5xx server errors and 429 are retryable
    if (error.statusCode && (error.statusCode >= 500 || error.statusCode === 429)) {
      return true;
    }

    return false;
  }

  /**
   * Handle final failure after all retries exhausted.
   *
   * @param {string} jobId - Job ID
   * @param {Object} data - Job data
   * @param {Error} error - Final error
   */
  async onFinalFailure(jobId, data, error) {
    const { webhookId, deliveryId } = data;

    if (deliveryId) {
      await this.webhookService.failDelivery(deliveryId, webhookId, error)
        .catch(err => this.logger.error('Failed to update webhook failure status', {
          error: err.message,
          deliveryId,
        }));
    }
  }

  /**
   * Process pending deliveries (called by scheduler)
   */
  async processPendingDeliveries(limit = NUMERIC_LIMITS.BULK_MAX) {
    const pendingDeliveries = await this.webhookRepository.findPendingDeliveries(limit);

    this.logger.info(`Processing ${pendingDeliveries.length} pending webhook deliveries`);

    const results = [];

    for (const delivery of pendingDeliveries) {
      try {
        // Check if delivery should still be attempted
        if (!delivery.shouldRetry()) {
          // Mark as exhausted
          await this.webhookRepository.updateDeliveryById(delivery._id, {
            status: 'exhausted',
          });
          results.push({ deliveryId: delivery._id, status: 'exhausted' });
          continue;
        }

        // Create job for delivery
        const job = await this.jobService.createJob({
          type: 'webhook_delivery',
          status: JOB_STATUS.PENDING,
          userId: delivery.webhookId.userId, // Get from webhook
          metadata: {
            webhookId: delivery.webhookId._id,
            deliveryId: delivery._id,
          },
        });

        results.push({
          deliveryId: delivery._id,
          jobId: job._id,
          status: 'queued',
        });

      } catch (error) {
        this.logger.error('Failed to queue pending delivery', {
          deliveryId: delivery._id,
          error: error.message,
        });
        results.push({
          deliveryId: delivery._id,
          status: OPERATION_STATUS.ERROR,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Retry failed deliveries for a webhook
   */
  async retryFailedDeliveries(webhookId, limit = NUMERIC_LIMITS.BULK_MAX) {
    // Fetch webhook to get userId
    const webhook = await this.webhookRepository.findWebhookById(webhookId);
    if (!webhook) {
      throw ErrorFactory.webhookNotFound(webhookId);
    }

    const failedDeliveries = await this.webhookRepository.findDeliveriesByWebhookId(
      webhookId,
      {
        status: [WEBHOOK_DELIVERY_STATUS.FAILED, WEBHOOK_DELIVERY_STATUS.RETRYING],
        limit,
      },
    );

    this.logger.info(`Retrying ${failedDeliveries.length} failed deliveries for webhook ${webhookId}`);

    const results = [];

    for (const delivery of failedDeliveries) {
      try {
        // Reset delivery for retry
        await this.webhookRepository.updateDeliveryById(delivery._id, {
          status: WEBHOOK_DELIVERY_STATUS.PENDING,
          nextRetryAt: null,
          attempts: [], // Reset attempts
        });

        // Create job for retry
        const job = await this.jobService.createJob({
          type: 'webhook_delivery',
          status: JOB_STATUS.PENDING,
          userId: webhook.userId, // Use userId from fetched webhook
          metadata: {
            webhookId,
            deliveryId: delivery._id,
          },
        });

        results.push({
          deliveryId: delivery._id,
          jobId: job._id,
          status: WEBHOOK_DELIVERY_STATUS.RETRY_QUEUED,
        });

      } catch (error) {
        this.logger.error('Failed to retry delivery', {
          deliveryId: delivery._id,
          error: error.message,
        });
        results.push({
          deliveryId: delivery._id,
          status: WEBHOOK_DELIVERY_STATUS.RETRY_FAILED,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Clean up old delivery records
   */
  async cleanupOldDeliveries(daysOld = CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD) {
    const result = await this.webhookRepository.cleanupOldDeliveries(daysOld);

    this.logger.info(`Cleaned up ${result.deletedCount} old webhook delivery records`);

    return {
      deletedCount: result.deletedCount,
      daysOld,
    };
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStatistics(webhookId, timeframe = 'day') {
    const trends = await this.webhookRepository.getDeliveryTrends(webhookId, timeframe);
    const stats = await this.webhookRepository.getDeliveryStats(webhookId);

    return {
      trends,
      summary: stats.length > 0 ? stats[0] : {
        total: 0,
        successful: 0,
        failed: 0,
        retrying: 0,
        exhausted: 0,
        avgDuration: 0,
        lastDelivery: null,
      },
    };
  }

  /**
   * Validate webhook endpoint
   */
  async validateWebhookEndpoint(webhook) {
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Webhook endpoint validation',
        webhookId: webhook._id.toString(),
      },
    };

    try {
      const result = await this.webhookService.deliverWebhook(
        webhook,
        testPayload,
        'webhook.test',
      );

      return {
        isValid: result.success,
        statusCode: result.statusCode,
        responseTime: result.duration,
        error: result.error,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk retry deliveries for multiple webhooks
   */
  async bulkRetryDeliveries(webhookIds, limitPerWebhook = Math.floor(NUMERIC_LIMITS.BULK_MAX / WEBHOOK.BULK_RETRY_DIVISOR)) {
    const results = [];

    for (const webhookId of webhookIds) {
      try {
        const webhookResults = await this.retryFailedDeliveries(webhookId, limitPerWebhook);
        results.push({
          webhookId,
          retriesQueued: webhookResults.filter(r => r.status === WEBHOOK_DELIVERY_STATUS.RETRY_QUEUED).length,
          failedRetries: webhookResults.filter(r => r.status === WEBHOOK_DELIVERY_STATUS.RETRY_FAILED).length,
        });
      } catch (error) {
        results.push({
          webhookId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Process dead letter queue (exhausted deliveries)
   */
  async processDeadLetterQueue(limit = NUMERIC_LIMITS.LIMIT_MAX) {
    const exhaustedDeliveries = await this.webhookRepository.findDeliveriesByWebhookId(
      null, // All webhooks
      {
        status: 'exhausted',
        limit,
      },
    );

    this.logger.info(`Processing ${exhaustedDeliveries.length} exhausted deliveries`);

    // For now, just log them. In production, you might:
    // - Send alerts to webhook owners
    // - Store in a separate dead letter table
    // - Attempt manual review

    const results = exhaustedDeliveries.map(delivery => ({
      deliveryId: delivery._id,
      webhookId: delivery.webhookId,
      eventType: delivery.eventType,
      attempts: delivery.attempts.length,
      lastError: delivery.attempts[delivery.attempts.length - 1]?.error,
    }));

    // Log dead letter items
    this.logger.warn('Dead letter webhook deliveries found', {
      count: results.length,
      deliveries: results.slice(0, 10), // Log first 10
    });

    return results;
  }
}

module.exports = WebhookDeliveryProcessor;

