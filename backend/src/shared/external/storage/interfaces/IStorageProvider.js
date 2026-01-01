/**
 * STORAGE PROVIDER INTERFACE
 * 
 * Defines contract for all storage implementations
 * 
 * @module shared/external/storage/interfaces/IStorageProvider
 */

class IStorageProvider {
  /**
   * Upload file to storage
   * @param {Buffer|Stream} data - File data
   * @param {string} key - Storage key/path
   * @param {Object} options - Upload options
   * @param {string} options.contentType - MIME type
   * @param {Object} options.metadata - Additional metadata
   * @param {boolean} options.public - Make publicly accessible
   * @returns {Promise<Object>} Upload result with key, url, metadata
   */
  async upload(data, key, options = {}) {
    throw new Error('upload() must be implemented');
  }

  /**
   * Download file from storage
   * @param {string} key - Storage key/path
   * @returns {Promise<Buffer>} File data
   */
  async download(key) {
    throw new Error('download() must be implemented');
  }

  /**
   * Delete file from storage
   * @param {string} key - Storage key/path
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    throw new Error('delete() must be implemented');
  }

  /**
   * Check if file exists
   * @param {string} key - Storage key/path
   * @returns {Promise<boolean>} Exists status
   */
  async exists(key) {
    throw new Error('exists() must be implemented');
  }

  /**
   * Get file metadata
   * @param {string} key - Storage key/path
   * @returns {Promise<Object>} File metadata
   */
  async getMetadata(key) {
    throw new Error('getMetadata() must be implemented');
  }

  /**
   * Generate signed URL for temporary access
   * @param {string} key - Storage key/path
   * @param {number} expiresIn - Expiration in seconds
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    throw new Error('getSignedUrl() must be implemented');
  }

  /**
   * List files with optional prefix
   * @param {string} prefix - Key prefix to filter
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} List of file metadata
   */
  async list(prefix = '', options = {}) {
    throw new Error('list() must be implemented');
  }

  /**
   * Copy file within storage
   * @param {string} sourceKey - Source key
   * @param {string} destKey - Destination key
   * @returns {Promise<Object>} Copy result
   */
  async copy(sourceKey, destKey) {
    throw new Error('copy() must be implemented');
  }

  /**
   * Move file within storage
   * @param {string} sourceKey - Source key
   * @param {string} destKey - Destination key
   * @returns {Promise<Object>} Move result
   */
  async move(sourceKey, destKey) {
    throw new Error('move() must be implemented');
  }
}

module.exports = IStorageProvider;

