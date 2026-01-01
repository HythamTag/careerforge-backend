const ConfigBuilder = require('./core/config-builder');

/**
 * CENTRALIZED CONFIGURATION - SINGLE SOURCE OF TRUTH
 *
 * This file serves as the single source of truth for all application configuration.
 * Configuration is immutable and validated at startup.
 *
 * Usage:
 * ```javascript
 * const config = require('@config');
 * console.log(config.server.port);
 * ```
 *
 * Testing:
 * ```javascript
 * const { resetConfig } = require('@config');
 * resetConfig();
 * ```
 */

// Create singleton instance
const configBuilder = new ConfigBuilder();

// Build configuration immediately
let config;
try {
  config = configBuilder.build();
  console.log('✅ Configuration loaded successfully');
} catch (error) {
  console.error('❌ Fatal: Configuration failed to load');
  console.error(error.message);
  if (error.details) {
    console.error('Details:', JSON.stringify(error.details, null, 2));
  }
  if (process.env.NODE_ENV === 'test') {
    throw error;
  }
  process.exit(1);
}

/**
 * Reset configuration (for testing only)
 * @returns {void}
 */
function resetConfig() {
  if (config.server.nodeEnv === 'production') {
    throw new Error('Cannot reset configuration in production');
  }
  configBuilder.reset();
}

/**
 * Get configuration builder instance (for testing)
 * @returns {ConfigBuilder}
 */
function getConfigBuilder() {
  return configBuilder;
}

// Export immutable configuration
module.exports = config;
module.exports.resetConfig = resetConfig;
module.exports.getConfigBuilder = getConfigBuilder;
module.exports.ConfigBuilder = ConfigBuilder;


