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
router.post('/', authMiddleware, validateCreateWebhookMiddleware, webhookController.createWebhook.bind(webhookController));
router.get('/', authMiddleware, validateGetWebhooksQueryMiddleware, webhookController.getWebhooks.bind(webhookController));

// Statistics (must come before parameterized routes)
router.get('/stats', authMiddleware, webhookController.getWebhookStats.bind(webhookController));

// Admin operations (must come before parameterized routes)
router.post('/cleanup', authMiddleware, validateCleanupDeliveriesMiddleware, webhookController.cleanupDeliveries.bind(webhookController));

// Individual webhook operations
router.get('/:id', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.getWebhook.bind(webhookController));
router.put('/:id', authMiddleware, validateWebhookIdParamsMiddleware, validateUpdateWebhookMiddleware, webhookController.updateWebhook.bind(webhookController));
router.delete('/:id', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.deleteWebhook.bind(webhookController));

// Webhook testing and management
router.post('/:id/test', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.testWebhook.bind(webhookController));
router.post('/:id/suspend', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.suspendWebhook.bind(webhookController));
router.post('/:id/activate', authMiddleware, validateWebhookIdParamsMiddleware, webhookController.activateWebhook.bind(webhookController));

// Delivery management
router.get('/:id/deliveries', authMiddleware, validateWebhookIdParamsMiddleware, validateDeliveriesQueryMiddleware, webhookController.getWebhookDeliveries.bind(webhookController));
router.get('/:id/deliveries/:deliveryId', authMiddleware, validateDeliveryIdParamsMiddleware, webhookController.getDeliveryDetails.bind(webhookController));
router.post('/:id/deliveries/:deliveryId/retry', authMiddleware, validateDeliveryIdParamsMiddleware, webhookController.retryDelivery.bind(webhookController));

// Trends and analytics
router.get('/:id/trends', authMiddleware, validateWebhookIdParamsMiddleware, validateTrendsQueryMiddleware, webhookController.getWebhookTrends.bind(webhookController));

module.exports = router;

