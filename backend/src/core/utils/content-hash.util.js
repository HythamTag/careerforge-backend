/**
 * CONTENT HASH UTILITY
 * 
 * Provides utilities for content comparison and hashing.
 * Used to detect duplicate content and prevent unnecessary version creation.
 * 
 * @module core/utils/content-hash.util
 */

const crypto = require('crypto');

/**
 * Generate a stable hash for CV content.
 * Handles nested objects and arrays consistently.
 * 
 * @param {Object} content - CV content to hash
 * @returns {string|null} MD5 hash of content, or null if empty
 */
function hashContent(content) {
    if (!content || typeof content !== 'object') {
        return null;
    }

    // Check if content is effectively empty
    if (Object.keys(content).length === 0) {
        return null;
    }

    // Check if all values are empty/null/undefined
    const hasRealContent = Object.values(content).some(value => {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
    });

    if (!hasRealContent) {
        return null;
    }

    // Create stable JSON representation (sorted keys)
    const stableJson = JSON.stringify(content, getSortedReplacer());
    return crypto.createHash('md5').update(stableJson).digest('hex');
}

/**
 * Create a replacer function that sorts object keys for stable JSON.
 * 
 * @returns {Function} JSON.stringify replacer function
 */
function getSortedReplacer() {
    return (key, value) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value).sort().reduce((sorted, k) => {
                sorted[k] = value[k];
                return sorted;
            }, {});
        }
        return value;
    };
}

/**
 * Check if two content objects are equal.
 * Uses hashing for efficient deep comparison.
 * 
 * @param {Object} contentA - First content object
 * @param {Object} contentB - Second content object
 * @returns {boolean} True if contents are equal
 */
function isContentEqual(contentA, contentB) {
    const hashA = hashContent(contentA);
    const hashB = hashContent(contentB);

    // Both null/empty means equal
    if (hashA === null && hashB === null) {
        return true;
    }

    // One null, one not means not equal
    if (hashA === null || hashB === null) {
        return false;
    }

    return hashA === hashB;
}

/**
 * Check if content is empty or has no meaningful data.
 * 
 * @param {Object} content - Content to check
 * @returns {boolean} True if content is empty
 */
function isContentEmpty(content) {
    return hashContent(content) === null;
}

/**
 * Calculate word count from CV content.
 * 
 * @param {Object} content - CV content
 * @returns {number} Total word count
 */
function calculateWordCount(content) {
    if (!content || typeof content !== 'object') {
        return 0;
    }

    let totalWords = 0;

    function countWords(value) {
        if (typeof value === 'string') {
            return value.split(/\s+/).filter(word => word.length > 0).length;
        }
        if (Array.isArray(value)) {
            return value.reduce((sum, item) => sum + countWords(item), 0);
        }
        if (value && typeof value === 'object') {
            return Object.values(value).reduce((sum, v) => sum + countWords(v), 0);
        }
        return 0;
    }

    totalWords = countWords(content);
    return totalWords;
}

module.exports = {
    hashContent,
    isContentEqual,
    isContentEmpty,
    calculateWordCount,
};
