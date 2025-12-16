/**
 * LaTeX Generation Service Interface
 * Owner: Backend Leader
 * Defines the contract for LaTeX generation services
 */

class ILatexService {
  // LaTeX generation operations
  async generateLatex(resumeData) {
    throw new Error('Method not implemented');
  }

  async compilePdf(latexContent) {
    throw new Error('Method not implemented');
  }

  async validateLatex(latexContent) {
    throw new Error('Method not implemented');
  }

  async addTemplate(templateName, resumeData) {
    throw new Error('Method not implemented');
  }
}

module.exports = ILatexService;
