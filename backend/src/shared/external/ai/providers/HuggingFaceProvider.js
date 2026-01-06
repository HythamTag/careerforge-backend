/**
 * HUGGINGFACE PROVIDER
 */
const BaseProvider = require('./BaseProvider');
const config = require('@config');

class HuggingFaceProvider extends BaseProvider {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || config.ai.apiKeys.huggingface;
    this.model = options.model || config.ai.models.parser.models.huggingface;
    this.name = 'huggingface';
  }

  getName() { return this.name; }

  async callAI(messages, options = {}) {
    const axios = require('axios');
    const { AIError } = require('@errors');
    const { ERROR_CODES, AI_PROVIDER_URLS } = require('@constants');

    try {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await axios.post(
        `${AI_PROVIDER_URLS.HUGGINGFACE_BASE}/${this.model}`,
        { inputs: prompt, parameters: { max_new_tokens: options.maxTokens || config.ai.models.parser.maxTokens, temperature: options.temperature ?? config.ai.models.parser.temperature } },
        { headers: { 'Authorization': `Bearer ${this.apiKey}` } },
      );

      const content = response.data[0]?.generated_text;
      if (!content) {
        throw new AIError('HuggingFace returned empty response', ERROR_CODES.AI_SERVICE_ERROR);
      }

      return content;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      throw new AIError(`HuggingFace API error: ${error.message}`, ERROR_CODES.AI_SERVICE_ERROR);
    }
  }
}
module.exports = HuggingFaceProvider;



