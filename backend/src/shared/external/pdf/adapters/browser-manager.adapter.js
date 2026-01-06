/**
 * BROWSER MANAGER ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Managing Puppeteer browser lifecycle
 * Uses Docker browserless/chrome container for PDF generation.
 * 
 * @module modules/generation/infrastructure/adapters/browser-manager.adapter
 */

const puppeteer = require('puppeteer');
const logger = require('@utils/logger');
const { FileError } = require('@errors');

class BrowserManagerAdapter {
  constructor(config) {
    this.dockerEndpoint = config.dockerEndpoint;
    this.config = {
      timeout: config.timeout,
      executablePath: config.executablePath,
    };
    this.browser = null;
  }

  /**
     * Get or create browser instance
     * Connects to Docker browserless container
     * @returns {Promise<Browser>} Puppeteer browser instance
     */
  async getBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await this._connectToDocker();
    }
    return this.browser;
  }

  /**
   * Connect to Docker browserless/chrome container OR launch local browser
   * @private
   * @returns {Promise<Browser>} Puppeteer browser instance
   */
  async _connectToDocker() {
    // Strategy 1: Connect to remote browser (if endpoint configured)
    if (this.dockerEndpoint) {
      try {
        const browser = await puppeteer.connect({
          browserWSEndpoint: this.dockerEndpoint,
        });

        logger.info('Connected to Docker Puppeteer', {
          operation: 'Browser connection',
          endpoint: this.dockerEndpoint,
        });

        return browser;
      } catch (error) {
        logger.warn('Failed to connect to browserless container, falling back to local launch', {
          error: error.message,
          endpoint: this.dockerEndpoint
        });
        // Fall through to local launch
      }
    }

    // Strategy 2: Launch local browser (Fallback / Default for Railway)
    // This requires Chromium to be installed in the Docker container (see Dockerfile)
    try {
      logger.info('Launching local Puppeteer browser...');
      const browser = await puppeteer.launch({
        executablePath: this.config.executablePath,
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Crucial for Docker
          '--disable-gpu'
        ]
      });
      logger.info('Local Puppeteer browser launched');
      return browser;
    } catch (launchError) {
      logger.logError(launchError, { operation: 'Browser Launch' });
      throw new FileError(
        `Failed to launch local browser: ${launchError.message}. ` +
        'If running in Docker, ensure Chromium is installed and PUPPETEER_EXECUTABLE_PATH is set.'
      );
    }
  }

  /**
     * Close browser instance
     * @returns {Promise<void>}
     */
  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed successfully');
      } catch (error) {
        logger.warn('Failed to close browser', {
          error: error.message,
        });
      }
    }
  }

  /**
     * Get browser status
     * @returns {Object} Browser status
     */
  getStatus() {
    return {
      isActive: this.browser !== null,
      isConnected: this.browser ? this.browser.isConnected() : false,
      endpoint: this.dockerEndpoint,
    };
  }
}

module.exports = BrowserManagerAdapter;


