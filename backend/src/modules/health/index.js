/**
 * HEALTH MODULE
 *
 * Health monitoring and system status endpoints.
 * Provides health checks, readiness probes, and metrics.
 *
 * @module modules/health
 */

const routes = require('./routes/health.routes');

module.exports = {
  name: 'health',
  routes: routes,
};

