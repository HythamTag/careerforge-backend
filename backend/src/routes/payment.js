const express = require('express');
const router = express.Router();

/**
 * Payment routes
 * Owner: Backend Leader
 * Routes: POST /subscriptions, POST /payments/webhook
 */

router.post('/subscriptions', (req, res) => {
  // TODO: Create subscription
  res.status(501).json({ message: 'Subscriptions not implemented' });
});

router.post('/webhook', (req, res) => {
  // TODO: Handle payment webhook
  res.status(501).json({ message: 'Webhooks not implemented' });
});

module.exports = router;
