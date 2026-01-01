/**
 * WEBHOOK SERVICE
 *
 * Webhook management and delivery service with job-based workflow.
 * Handles webhook configuration, event subscription, and reliable delivery.
 *
 * @module modules/webhooks/services/webhook.service
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const url = require('url');
const { WEBHOOK_DELIVERY_STATUS: DELIVERY_STATUS, JOB_STATUS, JOB_TYPE, ERROR_CODES, HTTP_TIMEOUT, CRYPTO, PAGINATION, CLEANUP, HTTP_STATUS_RANGES, OPERATION_STATUS } = require('@constants');
const { NotFoundError, ValidationError, AppError, ErrorFactory } = require('@errors');
const { pagination } = require('@utils');
const TransactionManager = require('@infrastructure/transaction.manager');

class WebhookService {
  /**
     * Create webhook service with dependency injection.
     */
  constructor(webhookRepository, jobService) {
    this.webhookRepository = webhookRepository;
    this.jobService = jobService;
  }

  /**
     * Create a new webhook configuration
     */
  async createWebhook(userId, webhookData) {
    const {
      name,
      description,
      url,
      events,
      retryPolicy = {},
      timeout = HTTP_TIMEOUT,
      filters = {},
      headers = {},
    } = webhookData;

    // Generate a secure secret for webhook signing
    const secret = crypto.randomBytes(CRYPTO.WEBHOOK_SECRET_BYTES).toString('hex');

    const webhook = await this.webhookRepository.createWebhook({
      userId,
      name,
      description,
      url,
      events: events,
      secret,
      retryPolicy: {
        maxRetries: retryPolicy.maxRetries,
        retryDelay: retryPolicy.retryDelay,
        backoffMultiplier: retryPolicy.backoffMultiplier,
      },
      timeout,
      filters,
      headers,
    });

    return {
      id: webhook._id,
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      secret: secret, // Only returned once during creation
      retryPolicy: webhook.retryPolicy,
      timeout: webhook.timeout,
      filters: webhook.filters,
      headers: webhook.headers,
      createdAt: webhook.createdAt,
      _links: {
        self: `/v1/webhooks/${webhook._id}`,
        update: `/v1/webhooks/${webhook._id}`,
        delete: `/v1/webhooks/${webhook._id}`,
        test: `/v1/webhooks/${webhook._id}/test`,
        deliveries: `/v1/webhooks/${webhook._id}/deliveries`,
      },
    };
  }

  /**
     * Get webhook by ID
     */
  async getWebhook(webhookId, userId) {
    const webhook = await this.webhookRepository.findWebhookByIdAndUser(webhookId, userId);

    if (!webhook) {
      throw ErrorFactory.webhookNotFound(webhookId);
    }

    return {
      id: webhook._id,
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      retryPolicy: webhook.retryPolicy,
      timeout: webhook.timeout,
      filters: webhook.filters,
      headers: webhook.headers,
      deliveryStats: webhook.deliveryStats,
      successRate: webhook.successRate,
      lastTriggeredAt: webhook.lastTriggeredAt,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      _links: {
        self: `/v1/webhooks/${webhook._id}`,
        update: `/v1/webhooks/${webhook._id}`,
        delete: `/v1/webhooks/${webhook._id}`,
        test: `/v1/webhooks/${webhook._id}/test`,
        deliveries: `/v1/webhooks/${webhook._id}/deliveries`,
        stats: `/v1/webhooks/${webhook._id}/stats`,
      },
    };
  }

  /**
     * Get user's webhooks
     */
  async getWebhooks(userId, options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      events,
      search,
      sort = '-createdAt',
    } = options;

    const filters = {
      status,
      events,
      search,
      sort,
      limit,
      skip: (page - 1) * limit,
    };

    const [webhooks, total] = await Promise.all([
      this.webhookRepository.findWebhooksByUserId(userId, filters),
      this.webhookRepository.countWebhooksByUserId(userId, { status, events, search }),
    ]);

    const webhookItems = webhooks.map(webhook => ({
      id: webhook._id,
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      successRate: webhook.successRate,
      lastTriggeredAt: webhook.lastTriggeredAt,
      createdAt: webhook.createdAt,
      _links: {
        self: `/v1/webhooks/${webhook._id}`,
        test: `/v1/webhooks/${webhook._id}/test`,
        deliveries: `/v1/webhooks/${webhook._id}/deliveries`,
      },
    }));

    // Build query params for pagination links
    const queryParams = {};
    if (options.status) { queryParams.status = options.status; }
    if (options.search) { queryParams.search = options.search; }

    const paginationInfo = pagination.calculate(page, limit, total);

    return {
      data: webhookItems,
      pagination: paginationInfo,
      _links: {
        ...pagination.generateLinks('/v1/webhooks', paginationInfo, queryParams),
        create: '/v1/webhooks',
      },
    };
  }

  /**
     * Update webhook configuration
     */
  async updateWebhook(webhookId, userId, updateData) {
    const webhook = await this.webhookRepository.findWebhookByIdAndUser(webhookId, userId);

    if (!webhook) {
      throw ErrorFactory.webhookNotFound(webhookId);
    }

    const allowedUpdates = [
      'name', 'description', 'url', 'events', 'status',
      'retryPolicy', 'timeout', 'filters', 'headers',
    ];

    const filteredUpdates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updateData[key];
      }
    });

    const updatedWebhook = await this.webhookRepository.updateWebhookById(webhookId, filteredUpdates);

    return {
      id: updatedWebhook._id,
      name: updatedWebhook.name,
      description: updatedWebhook.description,
      url: updatedWebhook.url,
      events: updatedWebhook.events,
      status: updatedWebhook.status,
      retryPolicy: updatedWebhook.retryPolicy,
      timeout: updatedWebhook.timeout,
      filters: updatedWebhook.filters,
      headers: updatedWebhook.headers,
      updatedAt: updatedWebhook.updatedAt,
      _links: {
        self: `/v1/webhooks/${updatedWebhook._id}`,
        test: `/v1/webhooks/${updatedWebhook._id}/test`,
      },
    };
  }

  /**
     * Delete webhook
     */
  async deleteWebhook(webhookId, userId) {
    return await TransactionManager.executeAtomic(async (session) => {
      const webhook = await this.webhookRepository.findWebhookByIdAndUser(webhookId, userId);

      if (!webhook) {
        throw ErrorFactory.webhookNotFound(webhookId);
      }

      // Delete all associated deliveries
      await this.webhookRepository.bulkUpdateDeliveries(webhookId, { status: DELIVERY_STATUS.FAILED }, { session });

      await this.webhookRepository.deleteWebhookById(webhookId, { session });

      return {
        message: 'Webhook deleted successfully',
        id: webhookId,
      };
    });
  }

  /**
     * Test webhook delivery
     */
  async testWebhook(webhookId, userId) {
    const webhook = await this.webhookRepository.findWebhookByIdAndUser(webhookId, userId);

    if (!webhook) {
      throw ErrorFactory.webhookNotFound(webhookId);
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook._id.toString(),
        userId: userId,
      },
    };

    try {
      const result = await this.deliverWebhook(webhook, testPayload, 'webhook.test');
      return {
        status: result.success ? DELIVERY_STATUS.SUCCESS : DELIVERY_STATUS.FAILED,
        statusCode: result.statusCode,
        response: result.response,
        duration: result.duration,
        message: result.success ? 'Test webhook delivered successfully' : 'Test webhook delivery failed',
      };
    } catch (error) {
      return {
        status: OPERATION_STATUS.ERROR,
        error: error.message,
        message: 'Test webhook delivery failed',
      };
    }
  }

  /**
     * Get webhook deliveries
     */
  async getWebhookDeliveries(webhookId, userId, options = {}) {
    const webhook = await this.webhookRepository.findWebhookByIdAndUser(webhookId, userId);

    if (!webhook) {
      throw ErrorFactory.webhookNotFound(webhookId);
    }

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      eventType,
      dateFrom,
      dateTo,
      sort = '-createdAt',
    } = options;

    const filters = {
      status,
      eventType,
      dateFrom,
      dateTo,
      sort,
      limit,
      skip: (page - 1) * limit,
    };

    const [deliveries, total] = await Promise.all([
      this.webhookRepository.findDeliveriesByWebhookId(webhookId, filters),
      this.webhookRepository.countDeliveriesByWebhookId(webhookId, { status, eventType, dateFrom, dateTo }),
    ]);

    const deliveryItems = deliveries.map(delivery => ({
      id: delivery._id,
      eventType: delivery.eventType,
      status: delivery.status,
      attempts: delivery.attempts.length,
      deliveredAt: delivery.deliveredAt,
      createdAt: delivery.createdAt,
      lastAttempt: delivery.attempts[delivery.attempts.length - 1],
      _links: {
        self: `/v1/webhooks/${webhookId}/deliveries/${delivery._id}`,
        retry: delivery.status !== DELIVERY_STATUS.SUCCESS ? `/v1/webhooks/${webhookId}/deliveries/${delivery._id}/retry` : null,
      },
    }));

    const paginationInfo = pagination.calculate(page, limit, total);
    const baseUrl = `/v1/webhooks/${webhookId}/deliveries`;

    return {
      data: deliveryItems,
      pagination: paginationInfo,
      _links: {
        ...pagination.generateLinks(baseUrl, paginationInfo),
        webhook: `/v1/webhooks/${webhookId}`,
      },
    };
  }

  /**
     * Get webhook statistics
     */
  async getWebhookStats(userId) {
    const stats = await this.webhookRepository.getUserWebhookStats(userId);

    return {
      overview: stats,
      _links: {
        self: '/v1/webhooks/stats',
        webhooks: '/v1/webhooks',
      },
    };
  }

  /**
     * Retry failed delivery
     */
  async retryDelivery(webhookId, deliveryId, userId) {
    const delivery = await this.webhookRepository.findDeliveryByIdAndUser(deliveryId, userId);

    if (!delivery) {
      throw ErrorFactory.deliveryNotFound(deliveryId);
    }

    // Verify delivery belongs to the specified webhook (webhookId can be ObjectId or string)
    const deliveryWebhookId = delivery.webhookId._id ? delivery.webhookId._id.toString() : delivery.webhookId.toString();
    if (deliveryWebhookId !== webhookId.toString()) {
      throw ErrorFactory.validationFailed('Delivery does not belong to this webhook', ERROR_CODES.WEBHOOK_DELIVERY_INVALID);
    }

    if (delivery.status === DELIVERY_STATUS.SUCCESS) {
      throw ErrorFactory.validationFailed('Delivery is already successful', ERROR_CODES.WEBHOOK_DELIVERY_SUCCESSFUL);
    }

    // Reset delivery for retry
    delivery.status = DELIVERY_STATUS.PENDING;
    delivery.nextRetryAt = null;
    delivery.attempts = []; // Reset attempts for clean retry
    await delivery.save();

    // Queue delivery job
    const jobData = {
      webhookId,
      deliveryId: delivery._id,
    };

    const jobOptions = {
      userId,
      metadata: {
        webhookId,
        deliveryId: delivery._id,
      },
    };

    await this.jobService.createJob(JOB_TYPE.WEBHOOK_DELIVERY, jobData, jobOptions);

    return {
      message: 'Delivery retry queued successfully',
      deliveryId: delivery._id,
    };
  }

  /**
     * Trigger webhook delivery for an event
     */
  async triggerWebhook(eventType, eventData, eventPayload) {
    const webhooks = await this.webhookRepository.findActiveWebhooksByEvent(eventType, eventData);

    const results = [];

    for (const webhook of webhooks) {
      try {
        // Update last triggered timestamp
        await this.webhookRepository.updateLastTriggered(webhook._id);

        // Create delivery record
        const delivery = await this.webhookRepository.createDelivery({
          webhookId: webhook._id,
          eventType,
          payload: eventPayload,
          status: DELIVERY_STATUS.PENDING,
        });

        // Queue delivery job
        const jobData = {
          webhookId: webhook._id,
          deliveryId: delivery._id,
        };

        const jobOptions = {
          userId: webhook.userId,
          metadata: {
            webhookId: webhook._id,
            deliveryId: delivery._id,
          },
        };

        await this.jobService.createJob(JOB_TYPE.WEBHOOK_DELIVERY, jobData, jobOptions);

        results.push({
          webhookId: webhook._id,
          deliveryId: delivery._id,
          status: JOB_STATUS.QUEUED,
        });
      } catch (error) {
        results.push({
          webhookId: webhook._id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
     * Deliver webhook to endpoint
     */
  async deliverWebhook(webhook, payload, eventType) {
    const timestamp = Date.now().toString();
    const signature = webhook.generateSignature(payload, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CV-Enhancer-Webhook/1.0',
      'X-Webhook-Event': eventType,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Signature': signature,
      ...webhook.headers,
    };

    const startTime = Date.now();

    try {
      const parsedUrl = url.parse(webhook.url);
      const isHttps = parsedUrl.protocol === 'https:';

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'POST',
        headers,
        timeout: webhook.timeout,
      };

      const result = await new Promise((resolve, reject) => {
        const req = (isHttps ? https : http).request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new AppError('Request timeout', 408, ERROR_CODES.JOB_TIMEOUT));
        });

        req.write(JSON.stringify(payload));
        req.end();
      });

      const duration = Date.now() - startTime;

      return {
        success: HTTP_STATUS_RANGES.isSuccess(result.statusCode),
        statusCode: result.statusCode,
        response: {
          headers: result.headers,
          body: result.body,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Process webhook delivery job (called by worker)
   */
  async processDeliveryJob(jobId, data, job) {
    const { webhookId, deliveryId } = data;

    // 1. Get delivery and webhook record
    const delivery = await this.webhookRepository.findDeliveryById(deliveryId);
    const webhook = await this.webhookRepository.findWebhookById(webhookId);

    if (!delivery || !webhook) {
      throw ErrorFactory.validationFailed('Delivery or webhook not found', ERROR_CODES.WEBHOOK_DELIVERY_NOT_FOUND);
    }

    // 2. Idempotency check
    if (delivery.status === DELIVERY_STATUS.SUCCESS) {
      return {
        deliveryId,
        alreadyDelivered: true,
        statusCode: delivery.attempts[delivery.attempts.length - 1]?.statusCode,
      };
    }

    // 3. Check if active
    if (!webhook.isActive()) {
      return {
        skipped: true,
        reason: 'webhook_inactive',
      };
    }

    // 4. Deliver webhook
    const result = await this.deliverWebhook(webhook, delivery.payload, delivery.eventType);

    // 5. Record attempt and update stats
    await this.webhookRepository.recordDeliveryAttempt(
      deliveryId,
      result.statusCode,
      result.response,
      result.error,
      result.duration
    );

    if (result.success) {
      await this.webhookRepository.recordSuccessfulDelivery(webhookId);
    } else {
      await this.webhookRepository.recordFailedDelivery(webhookId);
    }

    return {
      success: result.success,
      deliveryId,
      webhookId,
      statusCode: result.statusCode,
      duration: result.duration,
      attempts: (delivery.attempts || []).length + 1,
    };
  }

  /**
   * Fail webhook delivery (called by worker on final failure)
   */
  async failDelivery(deliveryId, webhookId, error) {
    // Record failed delivery attempt
    if (deliveryId) {
      await this.webhookRepository.recordDeliveryAttempt(
        deliveryId,
        error.statusCode || 0,
        null,
        { message: error.message, code: 'DELIVERY_FAILED' },
        0
      ).catch(() => { }); // Best effort

      // Update webhook failure stats
      if (webhookId) {
        await this.webhookRepository.recordFailedDelivery(webhookId).catch(() => { });
      }
    }
  }

  /**
   * Clean up old deliveries
   */
  async cleanupOldDeliveries(daysOld = CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD) {
    const result = await this.webhookRepository.cleanupOldDeliveries(daysOld);
    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old delivery records`,
    };
  }
}

module.exports = WebhookService;
