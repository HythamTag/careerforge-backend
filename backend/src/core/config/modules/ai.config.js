/**
 * AI CONFIGURATION
 *
 * AI provider and model configuration.
 * 
 * DESIGN PRINCIPLE:
 * This file contains ONLY logical routing configuration.
 * All hardware tuning (CTX, Batch, Threads, GPU) is managed
 * EXCLUSIVELY in docker-compose.yml via profiles.
 * 
 * The application is COMPLETELY UNAWARE of:
 * - GPU/CPU selection
 * - VRAM availability
 * - Context sizes
 * - Batch sizes
 * - Thread counts
 */

class AIConfig {
  static getConfig(env) {
    return {
      // Active AI provider (openai | anthropic | gemini | huggingface | ollama | mock)
      provider: env.AI_PROVIDER,

      // Request limits (application-level, not hardware-level)
      limits: {
        maxPromptLength: env.AI_MAX_PROMPT_LENGTH,
        minResponseLength: env.AI_MIN_RESPONSE_LENGTH,
        maxResponseLength: env.AI_MAX_RESPONSE_LENGTH,
        jsonValidationThreshold: env.AI_JSON_VALIDATION_THRESHOLD,
        maxRetries: env.AI_MAX_RETRIES,
        requestTimeout: env.AI_REQUEST_TIMEOUT,
      },

      // Task-specific model selection (MODELS ONLY - no hardware params)
      models: {
        parser: {
          openai: env.AI_MODEL_PARSER_OPENAI,
          anthropic: env.AI_MODEL_PARSER_ANTHROPIC,
          gemini: env.AI_MODEL_PARSER_GEMINI,
          huggingface: env.AI_MODEL_PARSER_HUGGINGFACE,
          ollama: env.AI_MODEL_PARSER_OLLAMA,
        },
        optimizer: {
          openai: env.AI_MODEL_OPTIMIZER_OPENAI,
          anthropic: env.AI_MODEL_OPTIMIZER_ANTHROPIC,
          gemini: env.AI_MODEL_OPTIMIZER_GEMINI,
          huggingface: env.AI_MODEL_OPTIMIZER_HUGGINGFACE,
          ollama: env.AI_MODEL_OPTIMIZER_OLLAMA,
        },
        ats: {
          ollama: env.AI_MODEL_ATS_FEEDBACK,
        },
      },

      // API keys for cloud providers
      apiKeys: {
        openai: env.OPENAI_API_KEY,
        anthropic: env.ANTHROPIC_API_KEY,
        gemini: env.GEMINI_API_KEY,
        huggingface: env.HUGGINGFACE_API_KEY,
      },

      // Ollama routing configuration (HOSTS ONLY - no hardware params)
      ollama: {
        // Default host (legacy compatibility)
        host: env.OLLAMA_HOST,
        // Task-specific hosts - each points to isolated container
        hosts: {
          parser: env.OLLAMA_PARSER_HOST,
          optimizer: env.OLLAMA_OPTIMIZER_HOST,
          ats: env.OLLAMA_ATS_HOST,
        },
        // Connection timeout
        timeout: env.OLLAMA_TIMEOUT,
      },
    };
  }

  /**
   * Get Ollama configuration for a specific task
   * This is the MANDATORY routing abstraction for all LLM calls
   * 
   * @param {string} task - Task type: 'parse', 'optimize', or 'ats'
   * @param {object} config - Full AI config object
   * @param {string} provider - AI provider name (default: 'ollama')
   * @returns {object} { host, model } configuration for the task
   */
  static getOllamaConfig(task, config, provider = 'ollama') {
    switch (task) {
      case 'parse':
        return {
          host: config.ollama.hosts.parser || config.ollama.host,
          model: config.models.parser[provider] || config.models.parser.ollama,
        };
      case 'optimize':
        return {
          host: config.ollama.hosts.optimizer || config.ollama.host,
          model: config.models.optimizer[provider] || config.models.optimizer.ollama,
        };
      case 'ats':
        return {
          host: config.ollama.hosts.ats || config.ollama.host,
          model: config.models.ats.ollama,
        };
      default:
        throw new Error(`Unknown task type: ${task}. Valid types: parse, optimize, ats`);
    }
  }
}

module.exports = AIConfig;
