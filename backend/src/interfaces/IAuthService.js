/**
 * Authentication Service Interface
 * Owner: Auth Developer
 * Defines the contract for authentication services
 */

class IAuthService {
  // Password operations
  async hashPassword(password) {
    throw new Error('Method not implemented');
  }

  async comparePassword(password, hash) {
    throw new Error('Method not implemented');
  }

  // Token operations
  async generateTokens(userId) {
    throw new Error('Method not implemented');
  }

  async verifyToken(token) {
    throw new Error('Method not implemented');
  }

  // User operations
  async createUser(userData) {
    throw new Error('Method not implemented');
  }

  async findUserByEmail(email) {
    throw new Error('Method not implemented');
  }

  async verifyUser(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IAuthService;
