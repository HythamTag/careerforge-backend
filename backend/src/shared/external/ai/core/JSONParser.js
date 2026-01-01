/**
 * JSON PARSER
 * 
 * Minimal JSON parser for AI responses.
 * Only handles documented provider quirks, not general malformed JSON.
 * 
 * @module shared/external/ai/core/JSONParser
 */

const logger = require('@utils/logger');
const { AIInvalidResponseError } = require('@errors');
const { STRING_LIMITS, ERROR_CODES } = require('@constants');

class JSONParser {
  /**
   * Parse JSON from AI response text
   * @param {string} responseText - Raw response text from AI
   * @returns {Object} Parsed JSON object
   * @throws {AIInvalidResponseError} If JSON is invalid
   */
  static parse(responseText) {
    try {
      let jsonText = responseText.trim();

      // Extract from markdown code blocks if wrapped
      jsonText = this.extractFromMarkdown(jsonText);

      // Handle documented provider quirks only
      jsonText = this.handleProviderQuirks(jsonText);

      // Extract JSON object if embedded in text
      jsonText = this.extractJSONObject(jsonText);

      return JSON.parse(jsonText);
    } catch (error) {
      // Log error with context
      logger.error('JSON parsing failed', {
        operation: 'Parse AI JSON response',
        error: error.message,
        responsePreview: responseText.substring(0, STRING_LIMITS.PREVIEW_MAX_LENGTH),
        errorPosition: this.getErrorPosition(error.message, responseText),
        hint: 'AI returned malformed JSON - this is a prompt engineering issue, not a parsing issue',
      });
      const invalidResponseError = new AIInvalidResponseError(
        `Invalid JSON response from AI: ${error.message}`,
        ERROR_CODES.AI_INVALID_RESPONSE
      );
      // Attach additional context to error for debugging
      invalidResponseError.details = {
        originalText: responseText.substring(0, 500),
        parseError: error.message,
        errorPosition: this.getErrorPosition(error.message, responseText),
      };
      throw invalidResponseError;
    }
  }

  /**
   * Handle documented provider-specific quirks
   * Only handles known, reproducible issues
   * @param {string} jsonText - JSON text to process
   * @returns {string} Processed JSON text
   */
  static handleProviderQuirks(jsonText) {
    // Ollama double-escapes newlines (\\n instead of \n)
    // This is a documented Ollama quirk
    if (jsonText.includes('\\\\n') || jsonText.includes('\\\\t') || jsonText.includes('\\\\r')) {
      jsonText = jsonText
        .replace(/\\\\n/g, '\n')
        .replace(/\\\\t/g, '\t')
        .replace(/\\\\r/g, '\r');
    }

    // Handle escaped JSON strings (Ollama sometimes wraps JSON in quotes)
    if (jsonText.startsWith('"{') && jsonText.endsWith('}"')) {
      jsonText = jsonText.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else if (jsonText.startsWith('"') && jsonText.endsWith('"') && jsonText.includes('{\\"')) {
      // Fully escaped JSON string
      try {
        jsonText = JSON.parse(jsonText);
      } catch {
        // If JSON.parse fails, try manual unescaping
        jsonText = jsonText.slice(1, -1)
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
      }
    }

    return jsonText;
  }

  /**
   * Extract position information from JSON parse error message
   * @param {string} errorMessage - Error message from JSON.parse
   * @param {string} text - Original text
   * @returns {Object|null} Position information
   */
  static getErrorPosition(errorMessage, text) {
    const posMatch = errorMessage.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const contextWindow = 50;
      return {
        position: pos,
        context: text.substring(
          Math.max(0, pos - contextWindow),
          Math.min(text.length, pos + contextWindow)
        ),
        charAtPosition: text[pos] || 'EOF',
      };
    }
    return null;
  }

  /**
   * Extract JSON from markdown code blocks
   * @param {string} jsonText - Text that may contain markdown-wrapped JSON
   * @returns {string} Extracted JSON text
   */
  static extractFromMarkdown(jsonText) {
    const markdownPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
    ];

    for (const pattern of markdownPatterns) {
      const match = jsonText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: remove markdown markers if present
    return jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  /**
   * Extract JSON object from text that may contain extra content
   * @param {string} jsonText - Text that may contain JSON object
   * @returns {string} Extracted JSON object text
   */
  static extractJSONObject(jsonText) {
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace === -1) {
      return jsonText;
    }

    // Find the matching closing brace by counting braces
    // This handles cases where there might be { or } inside string values
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = firstBrace; i < jsonText.length; i++) {
      const char = jsonText[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            return jsonText.substring(firstBrace, i + 1);
          }
        }
      }
    }

    // Fallback: try regex match if brace counting failed
    const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0];
    }
    return jsonText;
  }


}

module.exports = JSONParser;




