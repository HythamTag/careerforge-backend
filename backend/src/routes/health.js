const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 * Owner: Backend Leader
 * Route: GET /health
 */

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
