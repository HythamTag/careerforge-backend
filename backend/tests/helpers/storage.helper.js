/**
 * STORAGE TEST HELPERS
 *
 * Utility functions for storage module testing
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Create a temporary storage directory for testing
 */
async function createTestStorageDir() {
  const testDir = path.join(os.tmpdir(), `storage-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/**
 * Clean up test storage directory
 */
async function cleanupTestStorageDir(testDir) {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Create a mock storage provider
 */
function createMockStorageProvider() {
  const files = new Map();

  return {
    upload: jest.fn().mockImplementation(async (data, key) => {
      files.set(key, data);
      return {
        provider: 'mock',
        key,
        url: `http://localhost:3000/files/${key}`,
        size: data.length,
      };
    }),

    download: jest.fn().mockImplementation(async (key) => {
      if (!files.has(key)) {
        const error = new Error('File not found');
        error.code = 'ENOENT';
        throw error;
      }
      return files.get(key);
    }),

    delete: jest.fn().mockImplementation(async (key) => {
      const deleted = files.delete(key);
      return deleted;
    }),

    exists: jest.fn().mockImplementation(async (key) => {
      return files.has(key);
    }),

    getMetadata: jest.fn().mockImplementation(async (key) => {
      if (!files.has(key)) {
        const error = new Error('File not found');
        error.code = 'ENOENT';
        throw error;
      }
      const data = files.get(key);
      return {
        key,
        size: data.length,
        lastModified: new Date(),
      };
    }),

    getSignedUrl: jest.fn().mockImplementation(async (key) => {
      return `http://localhost:3000/files/${key}?signature=mock`;
    }),

    list: jest.fn().mockResolvedValue({ files: [] }),

    copy: jest.fn().mockImplementation(async (sourceKey, destKey) => {
      if (!files.has(sourceKey)) {
        throw new Error('Source file not found');
      }
      files.set(destKey, files.get(sourceKey));
      return { sourceKey, destKey };
    }),

    move: jest.fn().mockImplementation(async (sourceKey, destKey) => {
      if (!files.has(sourceKey)) {
        throw new Error('Source file not found');
      }
      files.set(destKey, files.get(sourceKey));
      files.delete(sourceKey);
      return { sourceKey, destKey };
    }),

    clear: () => files.clear(),
  };
}

/**
 * Create a mock storage factory
 */
function createMockStorageFactory(mockProvider) {
  return {
    getProvider: jest.fn().mockReturnValue(mockProvider),
    getAllProviders: jest.fn().mockReturnValue([mockProvider]),
    defaultType: 'local',
  };
}

/**
 * Generate test file buffer
 */
function generateTestFile(size = 1024, content = 'test') {
  return Buffer.from(content.repeat(Math.ceil(size / content.length)).substring(0, size));
}

module.exports = {
  createTestStorageDir,
  cleanupTestStorageDir,
  createMockStorageProvider,
  createMockStorageFactory,
  generateTestFile,
};

