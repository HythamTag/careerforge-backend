/**
 * STRING CLEANER UTILITY
 * 
 * Centralized utility for cleaning and sanitizing strings.
 * Extracted from OllamaProvider to follow Single Responsibility Principle.
 * 
 * @module utils/StringCleaner
 */

class StringCleaner {
  /**
     * Remove control characters from text.
     * Replaces tabs, newlines, carriage returns with spaces.
     * Removes all other control characters completely.
     * 
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
  static removeControlCharacters(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return text.replace(/[\x00-\x1F\x7F]/g, (char) => {
      const code = char.charCodeAt(0);
      // Replace whitespace-like control chars with space
      if (code === 0x09 || code === 0x0A || code === 0x0D) {
        return ' ';
      }
      // Remove all other control characters
      return '';
    });
  }

  /**
     * Escape control characters in JSON string values.
     * More aggressive - removes control chars from within JSON strings.
     * 
     * @param {string} jsonText - JSON text to clean
     * @returns {{text: string, removed: number}} Cleaned text and count of removed chars
     */
  static escapeControlCharsInJSON(jsonText) {
    if (!jsonText || typeof jsonText !== 'string') {
      return { text: jsonText, removed: 0 };
    }

    let result = '';
    let inString = false;
    let escapeNext = false;
    let controlCharsRemoved = 0;

    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];
      const code = char.charCodeAt(0);

      // Handle escape sequences
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        result += char;
        continue;
      }

      // Toggle string state on unescaped quotes
      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }

      // If inside a string, remove control characters
      if (inString) {
        if ((code >= 0x00 && code <= 0x1F) || code === 0x7F) {
          controlCharsRemoved++;
          continue; // Skip this character
        }
      }

      result += char;
    }

    return { text: result, removed: controlCharsRemoved };
  }

  /**
     * Strip markdown code blocks from text.
     * Handles ```json```, `````` and other markdown wrappers.
     * 
     * @param {string} text - Text that may contain markdown
     * @returns {string} Text with markdown stripped
     */
  static stripMarkdownCodeBlocks(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let cleaned = text.trim();

    // Remove ```json wrapper
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
    }

    return cleaned;
  }

  /**
     * Full JSON cleaning pipeline.
     * Strips markdown, removes control characters, prepares for parsing.
     * 
     * @param {string} text - Raw text that may contain JSON
     * @returns {{text: string, stats: object}} Cleaned text and cleaning stats
     */
  static cleanForJSON(text) {
    if (!text || typeof text !== 'string') {
      return { text: text, stats: { stripped: false, controlCharsRemoved: 0 } };
    }

    const originalLength = text.length;

    // Step 1: Strip markdown
    let cleaned = this.stripMarkdownCodeBlocks(text);
    const strippedMarkdown = cleaned.length !== text.length;

    // Step 2: Remove control characters
    cleaned = this.removeControlCharacters(cleaned);
    const controlCharsRemoved = originalLength - cleaned.length - (strippedMarkdown ? (text.length - cleaned.length) : 0);

    return {
      text: cleaned,
      stats: {
        stripped: strippedMarkdown,
        controlCharsRemoved: Math.max(0, controlCharsRemoved),
        originalLength,
        finalLength: cleaned.length,
      },
    };
  }

  /**
     * Sanitize a string for safe logging (remove sensitive data patterns).
     * 
     * @param {string} text - Text to sanitize
     * @param {number} maxLength - Maximum length to return
     * @returns {string} Sanitized text
     */
  static sanitizeForLogging(text, maxLength = 500) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Truncate if too long
    let sanitized = text.length > maxLength
      ? text.substring(0, maxLength) + '...[truncated]'
      : text;

    // Remove potential sensitive patterns (basic)
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

    return sanitized;
  }
}

module.exports = StringCleaner;

