const express = require('express');
const router = express.Router();

/**
 * Notifications routes
 * Owner: Backend Leader
 * Routes: GET /notifications, PATCH /notifications/:id/read
 */

router.get('/', (req, res) => {
  // TODO: Get user notifications
  res.status(501).json({ message: 'Notifications not implemented' });
});

router.patch('/:id/read', (req, res) => {
  // TODO: Mark notification as read
  res.status(501).json({ message: 'Mark as read not implemented' });
});

module.exports = router;
