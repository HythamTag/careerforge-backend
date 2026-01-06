/**
 * OPENAI PROVIDER
 */
const BaseProvider = require('./BaseProvider');
const config = require('@config');

class OpenAIProvider extends BaseProvider {
  constructor(options) {
    super();
    this.apiKey = options.apiKey ? options.apiKey : config.ai.apiKeys.openai;
    this.model = options.model ? options.model : config.ai.models.parser.models.openai;
    this.name = 'openai';
  }

  getName() { return this.name; }

  async callAI(messages, options) {
    const axios = require('axios');
    const { AIError } = require('@errors');
    const { ERROR_CODES, AI_PROVIDER_URLS } = require('@constants');

    try {
      const response = await axios.post(AI_PROVIDER_URLS.OPENAI, {
        model: options.model ? options.model : this.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens ? options.maxTokens : config.ai.models.parser.maxTokens,
      }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new AIError('OpenAI returned empty response', ERROR_CODES.AI_SERVICE_ERROR);
      }

      return content;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      throw new AIError(`OpenAI API error: ${error.message}`, ERROR_CODES.AI_SERVICE_ERROR);
    }
  }
}
module.exports = OpenAIProvider;



