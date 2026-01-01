/**
 * USERS MODULE
 *
 * User management and profile operations.
 *
 * @module modules/users
 */

const routes = require('./routes/user.routes');

module.exports = {
  name: 'users',
  routes: routes,
};
