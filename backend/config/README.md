# Configuration Directory

This directory contains all application configuration files, including testing, linting, and runtime configurations.

## Files

### `jest.config.js`
Jest testing framework configuration with:
- Test environment setup (Node.js)
- Coverage collection settings
- Module name mapping for clean imports
- Test file patterns and setup

### `nodemon.json`
Development server configuration for automatic restarts during development.

## Configuration Principles

1. **Single Source of Truth**: All configuration is centralized here
2. **Environment Aware**: Configurations adapt based on NODE_ENV
3. **Immutable**: Configurations are frozen after loading
4. **Validated**: All configurations are validated at startup

## Usage

Configurations are automatically loaded by the application. No manual imports required - use the centralized config system:

```javascript
const config = require('@config');
console.log(config.server.port);
```

## Adding New Configuration

1. **Choose appropriate file**: Add to existing config files or create new ones
2. **Follow naming pattern**: `*.config.js` for configuration modules
3. **Export function**: Return configuration object from a function
4. **Document thoroughly**: Include comments explaining each setting
5. **Validate inputs**: Add validation in `config-builder.js`

## Environment Variables

Configuration values are loaded from environment variables. See `.env.example` for all available options.

## Testing

Configuration can be reset for testing:

```javascript
const { resetConfig } = require('@config');
resetConfig(); // For testing only
```
