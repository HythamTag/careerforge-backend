/**
 * Authentication tests
 * Owner: Auth Developer
 */

const AuthService = require('../src/services/authService');

describe('AuthService', () => {
  test('should hash password', async () => {
    const password = 'testpassword';
    const hash = await AuthService.hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  test('should generate tokens', () => {
    const userId = 'user123';
    const tokens = AuthService.generateTokens(userId);

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });
});
