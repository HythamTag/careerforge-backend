/**
 * WEBHOOKS MODULE
 *
 * Webhook management module with event-driven architecture.
 * Handles webhook configuration, delivery, and monitoring.
 *
 * @module modules/webhooks
 */

const routes = require('./routes/webhook.routes');

module.exports = {
  name: 'webhooks',
  routes: routes,
};

