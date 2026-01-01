/**
 * JOBS MODULE
 *
 * Universal job management system for background processing.
 * Handles job queuing, status tracking, and result management.
 *
 * @module modules/jobs
 */

const routes = require('./routes/job.routes');

module.exports = {
  name: 'jobs',
  routes: routes,
};

