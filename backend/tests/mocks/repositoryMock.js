/**
 * Repository mock
 */

const mockCVRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  updateById: jest.fn(),
  updateStatus: jest.fn(),
  updateParsedData: jest.fn(),
  addOptimizedVersion: jest.fn(),
  updateError: jest.fn(),
  deleteById: jest.fn(),
};

module.exports = {
  mockCVRepository,
};

