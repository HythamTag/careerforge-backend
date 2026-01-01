const logger = require('@utils/logger');

/**
 * Minimal schema transformer - relies on AI to output correct format
 * Only handles edge cases where AI might use alternative field names
 * All parsing logic should be handled by the AI prompt, not hard-coded here
 */
class OllamaSchemaTransformer {
  static transform(ollamaData) {
    try {
      // Return data as-is - AI should output correct format
      // Only log for debugging
      logger.debug('Schema transformation applied (minimal - AI handles parsing)', {
        hasPersonal: !!ollamaData.personal,
        hasExperience: !!ollamaData.experience,
        hasEducation: !!ollamaData.education,
        hasSkills: !!ollamaData.skills,
      });

      return ollamaData;
    } catch (error) {
      logger.warn('Schema transformation failed, returning original', {
        error: error.message,
      });
      return ollamaData;
    }
  }
}

module.exports = OllamaSchemaTransformer;




