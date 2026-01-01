/**
 * CV OPTIMIZER MODULE
 *
 * AI-powered CV content optimization.
 * Direct optimization without job orchestration overhead.
 *
 * @module modules/cv-optimizer
 */

const routes = require('./routes/cv-optimizer.routes');

module.exports = {
  name: 'cv-optimizer',
  routes: routes,
};
