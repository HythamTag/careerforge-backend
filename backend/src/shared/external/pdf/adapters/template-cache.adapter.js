/**
 * TEMPLATE CACHE ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Template caching
 * Simple in-memory cache for template content
 * 
 * @module modules/generation/infrastructure/adapters/TemplateCache
 */

const logger = require('@utils/logger');

class TemplateCache {
  constructor() {
    this.cache = new Map();
  }

  /**
     * Get cached template
     * @param {string} key - Cache key
     * @returns {string|undefined} Cached template content
     */
  get(key) {
    return this.cache.get(key);
  }

  /**
     * Store template in cache
     * @param {string} key - Cache key
     * @param {string} value - Template content
     */
  set(key, value) {
    this.cache.set(key, value);
    logger.debug('Template cached', { key });
  }

  /**
     * Check if template is cached
     * @param {string} key - Cache key
     * @returns {boolean} True if cached
     */
  has(key) {
    return this.cache.has(key);
  }

  /**
     * Clear cache entry or entire cache
     * @param {string} [key] - Optional specific key to clear
     */
  clear(key = null) {
    if (key) {
      this.cache.delete(key);
      logger.info('Template cache entry cleared', { key });
    } else {
      this.cache.clear();
      logger.info('All template cache cleared');
    }
  }

  /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

module.exports = TemplateCache;


