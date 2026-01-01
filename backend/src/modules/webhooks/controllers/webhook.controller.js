/**
 * WEBHOOK CONTROLLER
 *
 * HTTP request handlers for webhook management and monitoring.
 *
 * @module modules/webhooks/controllers/webhook.controller
 */

const logger = require('@utils/logger');
const { NUMERIC_LIMITS, HTTP_STATUS, ERROR_CODES } = require('@constants');
const { ResponseFormatter } = require('@utils');
const { NotFoundError, ValidationError } = require('@errors');

class WebhookController {
  /**
     * Create webhook controller with service injection.
     */
  constructor(webhookService) {
    this.service = webhookService;
  }

  /**
     * Create a new webhook
     * POST /v1/webhooks
     */
  async createWebhook(req, res, next) {
    try {
      const result = await this.service.createWebhook(req.userId, req.body);

      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
        statusCode: HTTP_STATUS.CREATED,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Create webhook error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get user's webhooks
     * GET /v1/webhooks
     */
  async getWebhooks(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page, 10),
        limit: Math.min(parseInt(req.query.limit, 10), NUMERIC_LIMITS.LIMIT_MAX),
        status: req.query.status,
        events: req.query.events ? req.query.events.split(',') : undefined,
        search: req.query.search,
        sort: req.query.sort,
      };

      const result = await this.service.getWebhooks(req.userId, options);

      const { response, statusCode } = ResponseFormatter.paginated(result.data, result.pagination, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get webhooks error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get webhook by ID
     * GET /v1/webhooks/:id
     */
  async getWebhook(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.getWebhook(id, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Get webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Update webhook
     * PUT /v1/webhooks/:id
     */
  async updateWebhook(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.updateWebhook(id, req.userId, req.body);

      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Update webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Delete webhook
     * DELETE /v1/webhooks/:id
     */
  async deleteWebhook(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.deleteWebhook(id, req.userId);

      const { response, statusCode } = ResponseFormatter.success(null, {
        message: result.message,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Delete webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Test webhook delivery
     * POST /v1/webhooks/:id/test
     */
  async testWebhook(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.service.testWebhook(id, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Test webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get webhook delivery history
     * GET /v1/webhooks/:id/deliveries
     */
  async getWebhookDeliveries(req, res, next) {
    try {
      const { id } = req.params;
      const options = {
        page: parseInt(req.query.page, 10),
        limit: Math.min(parseInt(req.query.limit, 10), NUMERIC_LIMITS.LIMIT_MAX),
        status: req.query.status,
        eventType: req.query.eventType,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
        sort: req.query.sort,
      };

      const result = await this.service.getWebhookDeliveries(id, req.userId, options);

      const { response, statusCode } = ResponseFormatter.paginated(result.data, result.pagination, {
        links: result._links,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Get webhook deliveries error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Get webhook statistics
     * GET /v1/webhooks/stats
     */
  async getWebhookStats(req, res, next) {
    try {
      const result = await this.service.getWebhookStats(req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Get webhook stats error', { error: error.message, userId: req.userId });
      next(error);
    }
  }

  /**
     * Retry failed delivery
     * POST /v1/webhooks/:id/deliveries/:deliveryId/retry
     */
  async retryDelivery(req, res, next) {
    try {
      const { id, deliveryId } = req.params;
      const result = await this.service.retryDelivery(id, deliveryId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result, {
        message: result.message,
      });

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Retry delivery error', {
        error: error.message,
        webhookId: req.params.id,
        deliveryId: req.params.deliveryId,
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
     * Get webhook delivery details
     * GET /v1/webhooks/:id/deliveries/:deliveryId
     */
  async getDeliveryDetails(req, res, next) {
    try {
      const { id, deliveryId } = req.params;

      // This would need to be implemented in the service
      const delivery = await this.service.getDeliveryDetails(id, deliveryId, req.userId);

      const { response, statusCode } = ResponseFormatter.success(delivery);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Get delivery details error', {
        error: error.message,
        webhookId: req.params.id,
        deliveryId: req.params.deliveryId,
        userId: req.userId,
      });
      next(error);
    }
  }

  /**
     * Suspend webhook
     * POST /v1/webhooks/:id/suspend
     */
  async suspendWebhook(req, res, next) {
    try {
      const { id } = req.params;

      // This would need to be implemented in the service
      const result = await this.service.suspendWebhook(id, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Suspend webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Activate webhook
     * POST /v1/webhooks/:id/activate
     */
  async activateWebhook(req, res, next) {
    try {
      const { id } = req.params;

      // This would need to be implemented in the service
      const result = await this.service.activateWebhook(id, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Activate webhook error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Clean up old deliveries (admin endpoint)
     * POST /v1/webhooks/cleanup
     */
  async cleanupDeliveries(req, res, next) {
    try {
      const daysOld = parseInt(req.body.daysOld, 10);
      const result = await this.service.cleanupOldDeliveries(daysOld);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Cleanup deliveries error', { error: error.message });
      next(error);
    }
  }

  /**
     * Get webhook delivery trends
     * GET /v1/webhooks/:id/trends
     */
  async getWebhookTrends(req, res, next) {
    try {
      const { id } = req.params;
      const timeframe = req.query.timeframe;

      // This would need to be implemented in the service
      const result = await this.service.getWebhookTrends(id, req.userId, timeframe);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }
      logger.error('Get webhook trends error', { error: error.message, webhookId: req.params.id, userId: req.userId });
      next(error);
    }
  }

  /**
     * Bulk operations on webhooks
     * POST /v1/webhooks/bulk/:action
     */
  async bulkWebhookOperation(req, res, next) {
    try {
      const { action } = req.params;
      const { webhookIds } = req.body;

      if (!Array.isArray(webhookIds) || webhookIds.length === 0) {
        const error = new ValidationError('webhookIds array is required', ERROR_CODES.VALIDATION_ERROR);
        return res.status(error.statusCode).json(ResponseFormatter.error(error).response);
      }

      // This would need to be implemented in the service
      const result = await this.service.bulkWebhookOperation(action, webhookIds, req.userId);

      const { response, statusCode } = ResponseFormatter.success(result);

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Bulk webhook operation error', { error: error.message, action: req.params.action, userId: req.userId });
      next(error);
    }
  }
}

module.exports = WebhookController;

