/**
 * LaTeX generation tests
 * Owner: Backend Leader
 */

const LatexService = require('../src/services/latexService');

describe('LatexService', () => {
  test('should generate LaTeX', () => {
    const resumeData = { title: 'Software Developer' };
    const result = LatexService.generateLatex(resumeData);

    expect(result).toContain('\documentclass');
    expect(result).toContain('Software Developer');
  });
});
