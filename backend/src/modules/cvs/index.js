/**
 * CVS MODULE
 *
 * CV (Curriculum Vitae) management and lifecycle operations.
 * Core module for handling CV CRUD, metadata, versioning, and status management.
 *
 * @module modules/cvs
 */

const routes = require('./routes/cv.routes');

module.exports = {
  name: 'cvs',
  routes: routes,
};