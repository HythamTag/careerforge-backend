/**
 * AI PROVIDER CONSTANTS
 *
 * Single source of truth for AI provider configurations and endpoints.
 * All AI-related constants should be defined here.
 */

/**
 * AI Provider API Endpoints
 * @constant
 */
const AI_PROVIDER_URLS = {
    OPENAI: 'https://api.openai.com/v1/chat/completions',
    ANTHROPIC: 'https://api.anthropic.com/v1/messages',
    GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
    HUGGINGFACE_BASE: 'https://api-inference.huggingface.co/models',
};

/**
 * AI Provider API Versions
 * @constant
 */
const AI_API_VERSIONS = {
    ANTHROPIC: '2023-06-01',
    GEMINI: 'v1beta',
};

module.exports = {
    AI_PROVIDER_URLS,
    AI_API_VERSIONS,
};
