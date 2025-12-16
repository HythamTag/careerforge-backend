/**
 * ATS Analysis Service Interface
 * Owner: Backend Leader
 * Defines the contract for ATS analysis services
 */

class IATSService {
  // ATS analysis operations
  async analyzeResume(resumeData) {
    throw new Error('Method not implemented');
  }

  async getAnalysisScore(resumeData) {
    throw new Error('Method not implemented');
  }

  async getAnalysisSuggestions(resumeData) {
    throw new Error('Method not implemented');
  }

  async getKeywordMatches(resumeData, jobKeywords) {
    throw new Error('Method not implemented');
  }
}

module.exports = IATSService;
