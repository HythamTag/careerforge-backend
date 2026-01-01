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
     * Connect to Docker browserless/chrome container
     * @private
     * @returns {Promise<Browser>} Puppeteer browser instance
     */
  async _connectToDocker() {
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
      logger.logError(error, {
        operation: 'Browser connection',
        endpoint: this.dockerEndpoint,
      });
      throw new FileError(
        `Failed to connect to Docker Puppeteer at ${this.dockerEndpoint}. ` +
                'Ensure the Puppeteer container is running: docker compose -f docker-compose.puppeteer.yml up -d',
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


