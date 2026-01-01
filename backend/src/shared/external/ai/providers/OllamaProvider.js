/**
 * OLLAMA PROVIDER
 * Local LLM provider using Ollama
 */
const BaseProvider = require('./BaseProvider');
const config = require('@config');
const logger = require('@utils/logger');
const { AIError, AITimeoutError } = require('@errors');
const { ERROR_CODES } = require('@constants');

class OllamaProvider extends BaseProvider {
  constructor(options) {
    super();
    const ollamaConfig = config.ai.ollama;
    this.host = options.host ? options.host : ollamaConfig.host;
    this.model = options.model ? options.model : ollamaConfig.defaultModel;
    this.timeout = options.timeout ? options.timeout : ollamaConfig.timeout;
    this.name = 'ollama';
  }

  getName() { return this.name; }

  async callAI(messages, options) {
    const model = options.model ? options.model : this.model;
    const temperature = options.temperature;
    const format = options.format; // e.g., 'json'

    logger.info?.('Ollama API call', { model, format, messagesCount: messages.length });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          format, // Pass format (e.g. 'json') to enforce structured output
          options: {
            temperature,
            // Note: num_predict (max tokens) is NOT set here
            // Ollama uses sensible defaults and hardware tuning comes from Docker
          },
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error?.('Ollama API error', {
          status: response.status,
          statusText: response.statusText,
          errorBody,
          model,
        });
        throw new AIError(`Ollama API error [${model} @ ${this.host}]: ${response.status} - ${errorBody || response.statusText}`, ERROR_CODES.AI_SERVICE_ERROR);
      }

      const data = await response.json();
      let content = data.message?.content || data.response || '';

      // Clean markdown wrappers if present
      if (content) {
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
      }

      // Validate that we got content
      if (!content || content.trim().length === 0) {
        throw new AIError('Ollama returned empty response', ERROR_CODES.AI_SERVICE_ERROR);
      }

      return content;
    } catch (error) {
      clearTimeout(timeoutId);

      // Detailed logging for network/system errors
      logger.error?.('Ollama Provider Failure', {
        error: error.message,
        code: error.code, // ECONNREFUSED etc
        cause: error.cause,
        host: this.host,
        model: model,
        stack: error.stack
      });

      if (error.name === 'AbortError') {
        throw new AITimeoutError(`Ollama request timed out after ${this.timeout}ms`, ERROR_CODES.AI_TIMEOUT);
      }
      throw error;
    }
  }
}

module.exports = OllamaProvider;



