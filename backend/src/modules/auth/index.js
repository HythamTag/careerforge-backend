/**
 * AUTH MODULE
 *
 * Authentication module for user registration, login, and token management.
 *
 * @module modules/auth
 */

const routes = require('./routes/auth.routes');

module.exports = {
  name: 'auth',
  routes: routes,
};
