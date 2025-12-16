/**
 * ATS Analysis Data Transfer Objects
 * Owner: Backend Leader
 */

class ATSAnalysisDto {
  constructor(resumeId, jobDescription) {
    this.resumeId = resumeId;
    this.jobDescription = jobDescription;
  }

  validate() {
    if (!this.resumeId || !this.jobDescription) {
      throw new Error('resumeId and jobDescription are required');
    }
    return true;
  }
}

class ATSResultDto {
  constructor(analysis) {
    this.score = analysis.score;
    this.keywords = analysis.keywords;
    this.suggestions = analysis.suggestions;
    this.matchPercentage = analysis.matchPercentage;
    this.missingKeywords = analysis.missingKeywords;
  }
}

class KeywordMatchDto {
  constructor(keyword, count, required) {
    this.keyword = keyword;
    this.count = count;
    this.required = required;
    this.matched = count > 0;
  }
}

module.exports = {
  ATSAnalysisDto,
  ATSResultDto,
  KeywordMatchDto
};
