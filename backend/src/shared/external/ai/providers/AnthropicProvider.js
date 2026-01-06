/**
 * ANTHROPIC PROVIDER
 */
const BaseProvider = require('./BaseProvider');
const config = require('@config');

class AnthropicProvider extends BaseProvider {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || config.ai.apiKeys.anthropic;
    this.model = options.model || config.ai.models.parser.models.anthropic;
    this.name = 'anthropic';
  }

  getName() { return this.name; }

  async callAI(messages, options = {}) {
    const axios = require('axios');
    const { AIError } = require('@errors');
    const { ERROR_CODES, AI_PROVIDER_URLS, AI_API_VERSIONS } = require('@constants');

    try {
      const response = await axios.post(AI_PROVIDER_URLS.ANTHROPIC, {
        model: options.model || this.model,
        max_tokens: options.maxTokens || config.ai.models.parser.maxTokens,
        messages,
      }, { headers: { 'x-api-key': this.apiKey, 'anthropic-version': AI_API_VERSIONS.ANTHROPIC } });

      const content = response.data.content[0]?.text;
      if (!content) {
        throw new AIError('Anthropic returned empty response', ERROR_CODES.AI_SERVICE_ERROR);
      }

      return content;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      throw new AIError(`Anthropic API error: ${error.message}`, ERROR_CODES.AI_SERVICE_ERROR);
    }
  }
}
module.exports = AnthropicProvider;



