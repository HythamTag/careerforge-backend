/**
 * Jest setup file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/cv-enhancer-test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'test-key';
process.env.STORAGE_TYPE = 'local';
process.env.MAX_FILE_SIZE = '10485760';
process.env.MAX_PAGES = '8';
process.env.RATE_LIMIT_UPLOADS = '100';
process.env.RATE_LIMIT_WINDOW = '3600000';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Mock core modules to avoid complex dependencies in tests
jest.mock('../src/core/utils/core/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  child: jest.fn().mockReturnThis(),
  withCorrelationId: jest.fn().mockReturnThis(),
  withResumeContext: jest.fn().mockReturnThis(),
  logError: jest.fn(),
}));

// Don't mock constants - use real constants
// jest.mock('../src/core/constants/core/http.constants', ...) removed

// Mock business constants if needed - using actual constants file instead

// Mock user model
// Mock user model - REMOVED to allow integration tests to use real model
// Individual unit tests should mock the model if needed


// Increase timeout for integration tests
jest.setTimeout(30000);

