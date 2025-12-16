/**
 * ATS analysis tests
 * Owner: Backend Leader
 */

const ATSService = require('../src/services/atsService');

describe('ATSService', () => {
  test('should analyze resume', () => {
    const mockResumeData = {
      text: 'JavaScript React Node.js developer',
      sections: {}
    };

    const result = ATSService.analyzeResume(mockResumeData);

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('suggestions');
  });
});
