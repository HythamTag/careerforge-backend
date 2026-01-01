/**
 * BASE PROVIDER
 * 
 * Base class for all AI providers implementing IAIProvider interface
 * 
 * @module shared/external/ai/providers/BaseProvider
 */

const IAIProvider = require('../interfaces/IAIProvider');

class BaseProvider extends IAIProvider {
  /**
   * Get provider name
   * @returns {string} Provider identifier
   */
  getName() {
    throw new Error('getName() must be implemented');
  }

  /**
   * Call AI provider with messages
   * @param {Array<Object>} messages - Array of message objects
   * @param {Object} options - AI call options
   * @returns {Promise<string>} AI response text
   */
  async callAI(messages, options = {}) {
    throw new Error('callAI() must be implemented');
  }
}

module.exports = BaseProvider;



