/**
 * AI enhancement tests
 * Owner: Backend Leader
 */

const AIService = require('../src/services/aiService');

describe('AIService', () => {
  test('should enhance resume section', () => {
    const sectionText = 'I have experience with JavaScript';
    const result = AIService.enhanceSection(sectionText, 'experience');

    expect(result).toHaveProperty('enhanced');
    expect(result).toHaveProperty('confidence');
  });
});
