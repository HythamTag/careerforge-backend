/**
 * CV HELPER UTILITIES
 * 
 * Shared helper functions for CV template rendering
 * Used by both React components and Handlebars helpers
 */

/**
 * Format date for CV display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return 'Present';
    if (typeof date === 'string') return date;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Join array elements with separator
 * @param {Array} array - Array to join
 * @param {string} separator - Separator string (default: ', ')
 * @returns {string} Joined string
 */
export const joinArray = (array, separator) => {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
};

/**
 * Validate hex color format
 * @param {string} color - Hex color to validate
 * @returns {boolean} True if valid hex color
 */
export const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * Download blob as file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 */
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
