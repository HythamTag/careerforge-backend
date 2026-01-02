/**
 * WEBHOOK ROUTES
 *
 * Route definitions for webhook management with job-based workflow.
 *
 * @module modules/webhooks/routes/webhook.routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('@middleware');
const {
  validateCreateWebhookMiddleware,
  validateUpdateWebhookMiddleware,
  validateWebhookIdParamsMiddleware,
  validateDeliveryIdParamsMiddleware,
  validateGetWebhooksQueryMiddleware,
  validateDeliveriesQueryMiddleware,
  validateTrendsQueryMiddleware,
  validateCleanupDeliveriesMiddleware,
} = require('../validators/webhook.validator');

// Initialize controller with service from container
const WebhookController = require('../controllers/webhook.controller');
const { resolve } = require('@core/container');
const webhookService = resolve('webhookService');
const webhookController = new WebhookController(webhookService);

// Webhook management
/**
 * @internal // @openapi
 * /v1/webhooks:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Register a new webhook
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, events]
 *             properties:
 *               url: { type: 'string', format: 'uri' }
 *               events: { type: 'array', items: { type: 'string' } }
 *               secret: { type: 'string' }
 *     responses:
 *       201:
 *         description: Webhook registered successfully
 */
router.post('/', authMiddleware, validateCreateWebhookMiddleware, webhookController.createWebhook.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: List user webhooks
 */
router.get('/', authMiddleware, validateGetWebhooksQueryMiddleware, webhookController.getWebhooks.bind(webhookController));

// Statistics (must come before parameterized routes)
/**
 * @internal // @openapi
 * /v1/webhooks/stats:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Get webhook delivery statistics
 */
router.get('/stats', authMiddleware, webhookController.getWebhookStats.bind(webhookController));

// Admin operations (must come before parameterized routes)
/**
 * @internal // @openapi
 * /v1/webhooks/cleanup:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Cleanup old webhook deliveries
 */
router.post('/cleanup', authMiddleware, validateCleanupDeliveriesMiddleware, webhookController.cleanupDeliveries.bind(webhookController));

// Individual webhook operations
/**
 * @internal // @openapi
 * /v1/webhooks/{id}:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Get webhook details
 */
router.get('/:id', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.getWebhook.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}:
 *   put:
 *     tags:
 *       - Webhooks
 *     summary: Update webhook configuration
 */
router.put('/:id', authMiddleware, validateWebhookIdParamsMiddleware, validateUpdateWebhookMiddleware, webhookController.updateWebhook.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}:
 *   delete:
 *     tags:
 *       - Webhooks
 *     summary: Delete a webhook
 */
router.delete('/:id', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.deleteWebhook.bind(webhookController));

// Webhook testing and management
/**
 * @internal // @openapi
 * /v1/webhooks/{id}/test:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Send a test event to the webhook URL
 */
router.post('/:id/test', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.testWebhook.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}/suspend:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Suspend a webhook (stop sending events)
 */
router.post('/:id/suspend', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.suspendWebhook.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}/activate:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Activate a suspended webhook
 */
router.post('/:id/activate', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.activateWebhook.bind(webhookController));

// Delivery management
/**
 * @internal // @openapi
 * /v1/webhooks/{id}/deliveries:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Get delivery logs for a webhook
 */
router.get('/:id/deliveries', authMiddleware, validateWebhookIdParamsMiddleware, validateDeliveriesQueryMiddleware, webhookController.getWebhookDeliveries.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}/deliveries/{deliveryId}:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Get specific delivery attempt details
 */
router.get('/:id/deliveries/:deliveryId', authMiddleware, validateDeliveryIdParamsMiddleware, webhookController.getDeliveryDetails.bind(webhookController));

/**
 * @internal // @openapi
 * /v1/webhooks/{id}/deliveries/{deliveryId}/retry:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Manually retry a webhook delivery
 */
router.post('/:id/deliveries/:deliveryId/retry', authMiddleware, validateDeliveryIdParamsMiddleware, webhookController.retryDelivery.bind(webhookController));

// Trends and analytics
/**
 * @internal // @openapi
 * /v1/webhooks/{id}/trends:
 *   get:
 *     tags:
 *       - Webhooks
 *     summary: Get delivery result trends
 */
router.get('/:id/trends', authMiddleware, validateWebhookIdParamsMiddleware, validateTrendsQueryMiddleware, webhookController.getWebhookTrends.bind(webhookController));

module.exports = router;

