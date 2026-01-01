/**
 * CLEANUP UTILITIES
 *
 * Utilities for cleaning up temporary files, directories, and cached data.
 * Provides safe cleanup operations with proper error handling.
 *
 * @module utils/cleanup
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('@utils/logger');
const { TIME_CONSTANTS } = require('@constants');

/**
 * Clean up temporary files and directories
 */
class CleanupUtils {
  /**
   * Clean up files older than specified days in a directory
   *
   * @param {string} dirPath - Directory path to clean
   * @param {number} maxAgeDays - Maximum age in days
   * @param {string[]} excludePatterns - Glob patterns to exclude
   * @returns {Promise<{cleaned: number, errors: Error[]}>}
   */
  static async cleanupOldFiles(dirPath, maxAgeDays = 7, excludePatterns = []) {
    const cleaned = [];
    const errors = [];

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const now = Date.now();
      const maxAgeMs = maxAgeDays * TIME_CONSTANTS.MS_PER_DAY;

      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file.name);

          // Skip directories and excluded patterns
          if (file.isDirectory()) {continue;}
          if (excludePatterns.some(pattern => file.name.includes(pattern))) {continue;}

          const stats = await fs.stat(filePath);
          const ageMs = now - stats.mtime.getTime();

          if (ageMs > maxAgeMs) {
            await fs.unlink(filePath);
            cleaned.push(filePath);
            logger.info(`Cleaned up old file: ${filePath}`);
          }
        } catch (error) {
          errors.push(error);
          logger.warn(`Failed to cleanup file ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to cleanup directory ${dirPath}: ${error.message}`);
      errors.push(error);
    }

    return { cleaned: cleaned.length, errors };
  }

  /**
   * Clean up empty directories recursively
   *
   * @param {string} dirPath - Root directory to clean
   * @param {string[]} excludeDirs - Directory names to exclude
   * @returns {Promise<{cleaned: number, errors: Error[]}>}
   */
  static async cleanupEmptyDirectories(dirPath, excludeDirs = ['node_modules', '.git']) {
    const cleaned = [];
    const errors = [];

    try {
      await this._cleanupEmptyDirsRecursive(dirPath, excludeDirs, cleaned, errors);
    } catch (error) {
      logger.error(`Failed to cleanup empty directories in ${dirPath}: ${error.message}`);
      errors.push(error);
    }

    return { cleaned: cleaned.length, errors };
  }

  /**
   * Recursive helper for cleaning empty directories
   *
   * @private
   */
  static async _cleanupEmptyDirsRecursive(dirPath, excludeDirs, cleaned, errors) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      // Check if this directory should be excluded
      if (excludeDirs.includes(path.basename(dirPath))) {
        return false; // Not empty, but excluded
      }

      let hasContent = false;

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const isEmpty = await this._cleanupEmptyDirsRecursive(entryPath, excludeDirs, cleaned, errors);
          if (!isEmpty) {
            hasContent = true;
          }
        } else {
          hasContent = true;
        }
      }

      // If directory is empty and not excluded, remove it
      if (!hasContent && !excludeDirs.includes(path.basename(dirPath))) {
        await fs.rmdir(dirPath);
        cleaned.push(dirPath);
        logger.info(`Removed empty directory: ${dirPath}`);
        return true; // Was empty and removed
      }

      return false; // Not empty or excluded

    } catch (error) {
      errors.push(error);
      logger.warn(`Failed to process directory ${dirPath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Clean up temporary files with specific extensions
   *
   * @param {string} dirPath - Directory to clean
   * @param {string[]} extensions - File extensions to clean (without dots)
   * @returns {Promise<{cleaned: number, errors: Error[]}>}
   */
  static async cleanupTempFiles(dirPath, extensions = ['tmp', 'temp', 'log', 'cache']) {
    const cleaned = [];
    const errors = [];

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        try {
          if (file.isDirectory()) {continue;}

          const ext = path.extname(file.name).toLowerCase().slice(1);
          if (extensions.includes(ext)) {
            const filePath = path.join(dirPath, file.name);
            await fs.unlink(filePath);
            cleaned.push(filePath);
            logger.info(`Cleaned up temp file: ${filePath}`);
          }
        } catch (error) {
          errors.push(error);
          logger.warn(`Failed to cleanup temp file ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to cleanup temp files in ${dirPath}: ${error.message}`);
      errors.push(error);
    }

    return { cleaned: cleaned.length, errors };
  }

  /**
   * Comprehensive cleanup operation
   *
   * @param {Object} options - Cleanup options
   * @param {string} options.tempDir - Temporary directory path
   * @param {string} options.uploadsDir - Uploads directory path
   * @param {string} options.logsDir - Logs directory path
   * @param {number} options.maxAgeDays - Maximum age for cleanup
   * @returns {Promise<Object>} Cleanup results
   */
  static async comprehensiveCleanup(options = {}) {
    const {
      tempDir = path.join(process.cwd(), 'temp'),
      uploadsDir = path.join(process.cwd(), 'uploads'),
      logsDir = path.join(process.cwd(), 'logs'),
      maxAgeDays = 7,
    } = options;

    logger.info('Starting comprehensive cleanup operation', { maxAgeDays });

    const results = {
      tempFiles: { cleaned: 0, errors: [] },
      oldUploads: { cleaned: 0, errors: [] },
      oldLogs: { cleaned: 0, errors: [] },
      emptyDirs: { cleaned: 0, errors: [] },
      totalCleaned: 0,
      totalErrors: 0,
    };

    // Clean temp files
    if (await this._directoryExists(tempDir)) {
      results.tempFiles = await this.cleanupTempFiles(tempDir);
    }

    // Clean old uploads
    if (await this._directoryExists(uploadsDir)) {
      results.oldUploads = await this.cleanupOldFiles(uploadsDir, maxAgeDays);
    }

    // Clean old logs (keep last 30 days)
    if (await this._directoryExists(logsDir)) {
      results.oldLogs = await this.cleanupOldFiles(logsDir, 30);
    }

    // Clean empty directories
    const dirsToCheck = [tempDir, uploadsDir, logsDir].filter(dir => dir);
    for (const dir of dirsToCheck) {
      if (await this._directoryExists(dir)) {
        const dirResults = await this.cleanupEmptyDirectories(dir);
        results.emptyDirs.cleaned += dirResults.cleaned;
        results.emptyDirs.errors.push(...dirResults.errors);
      }
    }

    results.totalCleaned = results.tempFiles.cleaned + results.oldUploads.cleaned +
                          results.oldLogs.cleaned + results.emptyDirs.cleaned;
    results.totalErrors = results.tempFiles.errors.length + results.oldUploads.errors.length +
                         results.oldLogs.errors.length + results.emptyDirs.errors.length;

    logger.info('Comprehensive cleanup completed', {
      totalCleaned: results.totalCleaned,
      totalErrors: results.totalErrors,
    });

    return results;
  }

  /**
   * Check if directory exists
   *
   * @private
   * @param {string} dirPath - Directory path
   * @returns {Promise<boolean>}
   */
  static async _directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

module.exports = CleanupUtils;

