/**
 * CV PARSING MODULE
 *
 * Handles CV content extraction and parsing using multiple algorithms.
 * Supports various file formats and parsing strategies.
 *
 * @module modules/cv-parsing
 */

const routes = require('./routes/cv-parsing.routes');

module.exports = {
  name: 'cv-parsing',
  routes: routes,
};
