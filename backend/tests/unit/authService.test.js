/**
 * Unit tests for AuthService
 * Owner: Auth Developer
 */

const AuthService = require('../../src/services/authService');

describe('AuthService - Unit Tests', () => {
  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should produce different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateTokens', () => {
    test('should generate access and refresh tokens', () => {
      const userId = 'user123';
      const tokens = AuthService.generateTokens(userId);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const userId = 'user123';
      const tokens = AuthService.generateTokens(userId);
      
      const decoded = AuthService.verifyToken(tokens.accessToken);
      expect(decoded.id).toBe(userId);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });
  });
});
