/**
 * AI Enhancement Data Transfer Objects
 * Owner: Backend Leader
 */

class AIEnhancementDto {
  constructor(sectionText, sectionType, targetKeywords) {
    this.sectionText = sectionText;
    this.sectionType = sectionType;
    this.targetKeywords = targetKeywords;
  }

  validate() {
    if (!this.sectionText || !this.sectionType) {
      throw new Error('sectionText and sectionType are required');
    }
    return true;
  }
}

class AIResultDto {
  constructor(enhancement) {
    this.enhanced = enhancement.enhanced;
    this.confidence = enhancement.confidence;
    this.suggestions = enhancement.suggestions;
    this.improvements = enhancement.improvements;
  }
}

class LaTeXGenerationDto {
  constructor(resumeData, template) {
    this.resumeData = resumeData;
    this.template = template || 'default';
  }

  validate() {
    if (!this.resumeData) {
      throw new Error('resumeData is required');
    }
    return true;
  }
}

module.exports = {
  AIEnhancementDto,
  AIResultDto,
  LaTeXGenerationDto
};
