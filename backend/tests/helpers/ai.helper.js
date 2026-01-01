/**
 * AI TEST HELPERS
 *
 * Utility functions for AI module testing
 */

/**
 * Create a mock AI provider
 */
function createMockAIProvider(responses = []) {
  let callCount = 0;
  const defaultResponse = JSON.stringify({
    personal: { name: 'John Doe', email: 'john@example.com' },
    experience: [],
    education: [],
  });

  return {
    getName: jest.fn().mockReturnValue('mock'),
    callAI: jest.fn().mockImplementation(async (messages, options) => {
      if (callCount >= responses.length) {
        return defaultResponse;
      }
      return responses[callCount++] || defaultResponse;
    }),
    model: 'test-model',
  };
}

/**
 * Create a mock AI validator
 */
function createMockAIValidator() {
  return {
    validateMessages: jest.fn(),
    validateOptions: jest.fn(),
    validateResponse: jest.fn(),
  };
}

/**
 * Create valid JSON response
 */
function createValidJSONResponse(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Create malformed JSON response
 */
function createMalformedJSONResponse() {
  return '{"key": "value",}'; // trailing comma
}

/**
 * Create JSON wrapped in markdown
 */
function createWrappedJSONResponse(data) {
  return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
}

/**
 * Create response with provider quirks (Ollama-style)
 */
function createQuirkyJSONResponse(data) {
  const json = JSON.stringify(data);
  // Simulate Ollama double-escaping
  return json.replace(/\n/g, '\\\\n').replace(/\t/g, '\\\\t');
}

/**
 * Create mock messages array
 */
function createMockMessages(count = 1) {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`,
  }));
}

/**
 * Create error that simulates operational error
 */
function createOperationalError(message, code) {
  const error = new Error(message);
  error.isOperational = true;
  error.code = code;
  return error;
}

module.exports = {
  createMockAIProvider,
  createMockAIValidator,
  createValidJSONResponse,
  createMalformedJSONResponse,
  createWrappedJSONResponse,
  createQuirkyJSONResponse,
  createMockMessages,
  createOperationalError,
};

