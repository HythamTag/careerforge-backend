/**
 * AI PROVIDER INTERFACE
 * 
 * Defines contract for all AI provider implementations
 * 
 * @module shared/external/ai/interfaces/IAIProvider
 */

class IAIProvider {
  /**
   * Get provider name
   * @returns {string} Provider identifier (e.g., 'openai', 'ollama')
   */
  getName() {
    throw new Error('getName() must be implemented');
  }

  /**
   * Call AI provider with messages
   * @param {Array<Object>} messages - Array of message objects with role and content
   * @param {Object} options - AI call options
   * @param {string} options.model - Model name to use
   * @param {number} options.temperature - Temperature setting
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @param {string} options.format - Response format (e.g., 'json')
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<string>} AI response text
   */
  async callAI(messages, options = {}) {
    throw new Error('callAI() must be implemented');
  }
}

module.exports = IAIProvider;

