/**
 * GEMINI PROVIDER
 */
const BaseProvider = require('./BaseProvider');
const config = require('@config');

class GeminiProvider extends BaseProvider {
  constructor(options) {
    super();
    this.apiKey = options.apiKey ? options.apiKey : config.ai.apiKeys.gemini;
    this.model = options.model ? options.model : config.ai.models.parser.models.gemini;
    this.name = 'gemini';
  }

  getName() { return this.name; }

  async callAI(messages, options) {
    const axios = require('axios');
    const { AIError } = require('@errors');
    const { ERROR_CODES } = require('@constants');
    
    try {
      const model = options.model ? options.model : this.model;
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
          generationConfig: { temperature: options.temperature },
        },
      );
      
      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new AIError('Gemini returned empty response', ERROR_CODES.AI_SERVICE_ERROR);
      }
      
      return content;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      throw new AIError(`Gemini API error: ${error.message}`, ERROR_CODES.AI_SERVICE_ERROR);
    }
  }
}
module.exports = GeminiProvider;



