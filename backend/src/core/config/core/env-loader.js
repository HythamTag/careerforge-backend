// Load .env from project root (CV Enhancer root), not backend directory
// This ensures we use the root .env file as single source of truth
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Find project root by looking for .env file in parent directory
 * More robust than hardcoded path traversal
 * 
 * Starting from: backend/src/core/config/core/
 * Looking for: CV Enhancer root (where .env file is located)
 * 
 * Strategy:
 * 1. Find backend/package.json (we know we're in backend/)
 * 2. Check parent directory for .env file (project root)
 * 3. If .env exists in parent, that's the project root
 * 4. Otherwise, fall back to backend directory
 * 
 * @returns {string} Absolute path to project root
 * @throws {Error} If project root cannot be found
 */
function findProjectRoot() {
  let dir = __dirname; // backend/src/core/config/core/
  const root = path.parse(dir).root;

  // First, find backend/package.json
  let backendDir = null;
  while (dir !== root) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      backendDir = dir;
      break;
    }
    dir = path.dirname(dir);
  }

  if (!backendDir) {
    throw new Error('Cannot find project root: package.json not found in any parent directory');
  }

  // Check parent directory for .env file (project root)
  const parentDir = path.dirname(backendDir);
  const envPath = path.join(parentDir, '.env');

  if (fs.existsSync(envPath)) {
    // Parent directory has .env file, that's the project root
    return parentDir;
  }

  // Fallback: check if .env exists in backend directory
  const backendEnvPath = path.join(backendDir, '.env');
  if (fs.existsSync(backendEnvPath)) {
    return backendDir;
  }

  // If no .env found, assume parent is project root (common structure)
  return parentDir;
}

// Find project root dynamically
const rootPath = findProjectRoot();
const envPath = path.join(rootPath, '.env');

// Log for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log(`📁 Project root: ${rootPath}`);
  console.log(`📄 Loading .env from: ${envPath}`);
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  Warning: .env file not found at ${envPath}`);
  }
}

// Load root .env with override to ensure it takes precedence over any backend/.env
const result = dotenv.config({ path: envPath, override: true });

if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn(`⚠️  Warning: Failed to load .env file: ${result.error.message}`);
}

/**
 * ENVIRONMENT LOADER
 *
 * This is the ONLY place in the entire application that accesses process.env directly.
 * All environment variable access goes through this centralized loader.
 *
 * Features:
 * - Type-safe environment variable loading
 * - Comprehensive validation
 * - Default value handling
 * - Secure API key management
 */

class EnvironmentLoader {
  static load() {
    return {
      // ==========================================
      // SERVER CONFIGURATION
      // ==========================================
      PORT: this._parseNumber(process.env.PORT, 5000),
      NODE_ENV: process.env.NODE_ENV || 'development',
      HOST: process.env.HOST || 'localhost',

      // ==========================================
      // DATABASE CONFIGURATION
      // ==========================================
      // Automatically fallback to MONGO_URL if MONGODB_URI is not set (fixes Railway/Local mismatch)
      MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URL,
      DB_NAME: process.env.DB_NAME || 'resume_enhancer',

      // ==========================================
      // REDIS CONFIGURATION
      // ==========================================
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: this._parseNumber(process.env.REDIS_PORT, 6379),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DB: this._parseNumber(process.env.REDIS_DB, 0),
      REDIS_CONNECT_TIMEOUT: this._parseNumber(process.env.REDIS_CONNECT_TIMEOUT, 60000),
      REDIS_LAZY_CONNECT: this._parseBoolean(process.env.REDIS_LAZY_CONNECT, true),
      REDIS_RETRY_DELAY_ON_FAILOVER: this._parseNumber(process.env.REDIS_RETRY_DELAY_ON_FAILOVER, 100),
      REDIS_MAX_RETRIES_PER_REQUEST: this._parseNumber(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 3),

      // ==========================================
      // AI CONFIGURATION
      // ==========================================
      AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',

      // Per-provider model configuration (single source of truth)
      // Parser models
      AI_MODEL_PARSER_OPENAI: process.env.AI_MODEL_PARSER_OPENAI || 'gpt-4o-mini',
      AI_MODEL_PARSER_ANTHROPIC: process.env.AI_MODEL_PARSER_ANTHROPIC || 'claude-3-haiku-20240307',
      AI_MODEL_PARSER_GEMINI: process.env.AI_MODEL_PARSER_GEMINI || 'gemini-2.0-flash',
      AI_MODEL_PARSER_HUGGINGFACE: process.env.AI_MODEL_PARSER_HUGGINGFACE || 'google/gemma-2-2b-it',
      AI_MODEL_PARSER_OLLAMA: process.env.AI_MODEL_PARSER_OLLAMA || 'llama3.1:8b', // Standard model for consistency

      // Optimizer models
      AI_MODEL_OPTIMIZER_OPENAI: process.env.AI_MODEL_OPTIMIZER_OPENAI || 'gpt-4o-mini',
      AI_MODEL_OPTIMIZER_ANTHROPIC: process.env.AI_MODEL_OPTIMIZER_ANTHROPIC || 'claude-3-haiku-20240307',
      AI_MODEL_OPTIMIZER_GEMINI: process.env.AI_MODEL_OPTIMIZER_GEMINI || 'gemini-2.0-flash',
      AI_MODEL_OPTIMIZER_HUGGINGFACE: process.env.AI_MODEL_OPTIMIZER_HUGGINGFACE || 'google/gemma-2-2b-it',
      AI_MODEL_OPTIMIZER_OLLAMA: process.env.AI_MODEL_OPTIMIZER_OLLAMA || 'gemma2:9b',

      // AI parameters
      AI_TEMPERATURE_PARSER: this._parseFloat(process.env.AI_TEMPERATURE_PARSER, 0),
      AI_TEMPERATURE_OPTIMIZER: this._parseFloat(process.env.AI_TEMPERATURE_OPTIMIZER, 0.3),
      AI_MAX_TOKENS_PARSER: this._parseNumber(process.env.AI_MAX_TOKENS_PARSER, 2048),
      AI_MAX_TOKENS_OPTIMIZER: this._parseNumber(process.env.AI_MAX_TOKENS_OPTIMIZER, 6000),

      // AI limits
      AI_MAX_PROMPT_LENGTH: this._parseNumber(process.env.AI_MAX_PROMPT_LENGTH, 15000),
      AI_MIN_RESPONSE_LENGTH: this._parseNumber(process.env.AI_MIN_RESPONSE_LENGTH, 50),
      AI_MAX_RESPONSE_LENGTH: this._parseNumber(process.env.AI_MAX_RESPONSE_LENGTH, 8000),
      AI_JSON_VALIDATION_THRESHOLD: this._parseNumber(process.env.AI_JSON_VALIDATION_THRESHOLD, 3),
      AI_MAX_RETRIES: this._parseNumber(process.env.AI_MAX_RETRIES, 2),

      // API Keys (secure handling)
      // Validate API keys with strict mode when provider is actively selected
      OPENAI_API_KEY: this._validateApiKey(
        process.env.OPENAI_API_KEY,
        'OpenAI',
        process.env.AI_PROVIDER === 'openai'
      ),
      ANTHROPIC_API_KEY: this._validateApiKey(
        process.env.ANTHROPIC_API_KEY,
        'Anthropic',
        process.env.AI_PROVIDER === 'anthropic'
      ),
      GEMINI_API_KEY: this._validateApiKey(
        process.env.GEMINI_API_KEY,
        'Gemini',
        process.env.AI_PROVIDER === 'gemini'
      ),
      HUGGINGFACE_API_KEY: this._validateApiKey(
        process.env.HUGGINGFACE_API_KEY,
        'HuggingFace',
        process.env.AI_PROVIDER === 'huggingface'
      ),

      // Ollama Configuration (no API key required)
      OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
      OLLAMA_PARSER_HOST: process.env.OLLAMA_PARSER_HOST || 'http://localhost:11434',
      OLLAMA_OPTIMIZER_HOST: process.env.OLLAMA_OPTIMIZER_HOST || 'http://localhost:11435',
      OLLAMA_ATS_HOST: process.env.OLLAMA_ATS_HOST || 'http://localhost:11436',
      OLLAMA_TIMEOUT: this._parseNumber(process.env.OLLAMA_TIMEOUT, 120000),
      OLLAMA_DEFAULT_MODEL: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.1:8b',
      OLLAMA_STREAMING: this._parseBoolean(process.env.OLLAMA_STREAMING, true),

      // Parser-specific parameters (Llama 3.1 - precise)
      AI_TOP_P_PARSER: this._parseFloat(process.env.AI_TOP_P_PARSER, 0.1),
      AI_TOP_K_PARSER: this._parseNumber(process.env.AI_TOP_K_PARSER, 5),
      AI_CTX_PARSER: this._parseNumber(process.env.AI_CTX_PARSER, 4096),
      AI_REPEAT_PENALTY_PARSER: this._parseFloat(process.env.AI_REPEAT_PENALTY_PARSER, 1.1),

      // Optimizer-specific parameters (Gemma2 - creative)
      AI_TOP_P_OPTIMIZER: this._parseFloat(process.env.AI_TOP_P_OPTIMIZER, 0.4),
      AI_TOP_K_OPTIMIZER: this._parseNumber(process.env.AI_TOP_K_OPTIMIZER, 40),
      AI_CTX_OPTIMIZER: this._parseNumber(process.env.AI_CTX_OPTIMIZER, 8192),
      AI_REPEAT_PENALTY_OPTIMIZER: this._parseFloat(process.env.AI_REPEAT_PENALTY_OPTIMIZER, 1.05),

      // ATS Feedback parameters (gemma2:9b for suggestions - NO scoring)
      AI_MODEL_ATS_FEEDBACK: process.env.AI_MODEL_ATS_FEEDBACK || 'gemma2:9b',
      AI_TEMPERATURE_ATS: this._parseFloat(process.env.AI_TEMPERATURE_ATS, 0.35),
      AI_MAX_TOKENS_ATS: this._parseNumber(process.env.AI_MAX_TOKENS_ATS, 3000),

      // ==========================================
      // STORAGE CONFIGURATION
      // ==========================================
      STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
      STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH || './uploads',
      STORAGE_LOCAL_MAX_FILE_AGE: this._parseNumber(process.env.STORAGE_LOCAL_MAX_FILE_AGE, 86400000),
      S3_SIGNED_URL_EXPIRY: this._parseNumber(process.env.S3_SIGNED_URL_EXPIRY, 3600),

      // AWS S3 Configuration
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      S3_PUBLIC_READ: this._parseBoolean(process.env.S3_PUBLIC_READ, false),

      // ==========================================
      // FILE PROCESSING LIMITS
      // ==========================================
      MAX_FILE_SIZE: this._parseNumber(process.env.MAX_FILE_SIZE, 10485760), // 10MB
      MAX_PAGES: this._parseNumber(process.env.MAX_PAGES, 8),
      ALLOWED_MIME_TYPES: process.env.ALLOWED_MIME_TYPES?.split(',') || ['application/pdf'],

      // ==========================================
      // RATE LIMITING
      // ==========================================
      RATE_LIMIT_UPLOADS: this._parseNumber(process.env.RATE_LIMIT_UPLOADS, 10),
      RATE_LIMIT_WINDOW_MS: this._parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 3600000), // 1 hour
      RATE_LIMIT_MAX_REQUESTS: this._parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),

      // ==========================================
      // SECURITY CONFIGURATION
      // ==========================================
      CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
      ],
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',

      // ==========================================
      // PUPPETEER CONFIGURATION
      // ==========================================
      PUPPETEER_WS_ENDPOINT: process.env.PUPPETEER_WS_ENDPOINT || 'ws://localhost:3000/chrome',
      PUPPETEER_TIMEOUT: this._parseNumber(process.env.PUPPETEER_TIMEOUT, 30000),

      // ==========================================
      // LOGGING CONFIGURATION
      // ==========================================
      LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
      LOG_MAX_FILES: this._parseNumber(process.env.LOG_MAX_FILES, 5),

      // ==========================================
      // PERFORMANCE CONFIGURATION
      // ==========================================
      SLOW_REQUEST_THRESHOLD: this._parseNumber(process.env.SLOW_REQUEST_THRESHOLD, 1000),
      VERY_SLOW_REQUEST_THRESHOLD: this._parseNumber(process.env.VERY_SLOW_REQUEST_THRESHOLD, 5000),

      // ==========================================
      // JOB QUEUE CONFIGURATION
      // ==========================================
      JOB_MAX_ATTEMPTS: this._parseNumber(process.env.JOB_MAX_ATTEMPTS, 3),
      JOB_BACKOFF_DELAY: this._parseNumber(process.env.JOB_BACKOFF_DELAY, 2000),
      JOB_REMOVE_ON_COMPLETE_AGE: this._parseNumber(process.env.JOB_REMOVE_ON_COMPLETE_AGE, 86400000),
      JOB_REMOVE_ON_COMPLETE_COUNT: this._parseNumber(process.env.JOB_REMOVE_ON_COMPLETE_COUNT, 10),
      JOB_REMOVE_ON_FAIL_AGE: this._parseNumber(process.env.JOB_REMOVE_ON_FAIL_AGE, 604800000),
      JOB_QUEUE_PARSING_CONCURRENCY: this._parseNumber(process.env.JOB_QUEUE_PARSING_CONCURRENCY, 2),
      JOB_QUEUE_PARSING_PRIORITY: this._parseNumber(process.env.JOB_QUEUE_PARSING_PRIORITY, 5),
      JOB_QUEUE_ENHANCEMENT_CONCURRENCY: this._parseNumber(process.env.JOB_QUEUE_ENHANCEMENT_CONCURRENCY, 3),
      JOB_QUEUE_ENHANCEMENT_PRIORITY: this._parseNumber(process.env.JOB_QUEUE_ENHANCEMENT_PRIORITY, 7),
      JOB_QUEUE_GENERATION_CONCURRENCY: this._parseNumber(process.env.JOB_QUEUE_GENERATION_CONCURRENCY, 2),
      JOB_QUEUE_GENERATION_PRIORITY: this._parseNumber(process.env.JOB_QUEUE_GENERATION_PRIORITY, 6),
      JOB_QUEUE_WEBHOOK_DELIVERY_CONCURRENCY: this._parseNumber(process.env.JOB_QUEUE_WEBHOOK_DELIVERY_CONCURRENCY, 5),
      JOB_QUEUE_WEBHOOK_DELIVERY_PRIORITY: this._parseNumber(process.env.JOB_QUEUE_WEBHOOK_DELIVERY_PRIORITY, 8),
      JOB_LIMITER_MAX: this._parseNumber(process.env.JOB_LIMITER_MAX, 10),
      JOB_LIMITER_DURATION: this._parseNumber(process.env.JOB_LIMITER_DURATION, 1000),

      // ==========================================
      // EXTERNAL SERVICE TIMEOUTS
      // ==========================================
      HTTP_TIMEOUT: this._parseNumber(process.env.HTTP_TIMEOUT, 30000),
      AI_REQUEST_TIMEOUT: this._parseNumber(process.env.AI_REQUEST_TIMEOUT, 60000),
      DATABASE_TIMEOUT: this._parseNumber(process.env.DATABASE_TIMEOUT, 5000),
      DATABASE_MAX_POOL_SIZE: this._parseNumber(process.env.DATABASE_MAX_POOL_SIZE, 10),
      DATABASE_SERVER_SELECTION_TIMEOUT: this._parseNumber(process.env.DATABASE_SERVER_SELECTION_TIMEOUT, 5000),
      DATABASE_SOCKET_TIMEOUT: this._parseNumber(process.env.DATABASE_SOCKET_TIMEOUT, 45000),
      DATABASE_BUFFER_MAX_ENTRIES: this._parseNumber(process.env.DATABASE_BUFFER_MAX_ENTRIES, 0),
      DATABASE_BUFFER_COMMANDS: this._parseBoolean(process.env.DATABASE_BUFFER_COMMANDS, false),

      // ==========================================
      // MONITORING & METRICS
      // ==========================================
      ENABLE_METRICS: this._parseBoolean(process.env.ENABLE_METRICS, true),
      METRICS_PORT: this._parseNumber(process.env.METRICS_PORT, 9090),
      HEALTH_CHECK_INTERVAL: this._parseNumber(process.env.HEALTH_CHECK_INTERVAL, 30000),
      HEALTH_CHECK_TIMEOUT: this._parseNumber(process.env.HEALTH_CHECK_TIMEOUT, 5000),

      // ==========================================
      // PERFORMANCE TUNING
      // ==========================================
      COMPRESSION_LEVEL: this._parseNumber(process.env.COMPRESSION_LEVEL, 6),
      COMPRESSION_THRESHOLD: this._parseNumber(process.env.COMPRESSION_THRESHOLD, 1024),
      CACHE_MAX_AGE: this._parseNumber(process.env.CACHE_MAX_AGE, 3600000),
      RETRY_POLICY_MAX_RETRIES: this._parseNumber(process.env.RETRY_POLICY_MAX_RETRIES, 3),
      RETRY_POLICY_BACKOFF_MULTIPLIER: this._parseNumber(process.env.RETRY_POLICY_BACKOFF_MULTIPLIER, 2),
      RETRY_POLICY_INITIAL_DELAY: this._parseNumber(process.env.RETRY_POLICY_INITIAL_DELAY, 1000),
    };
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  static _parseNumber(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  static _parseFloat(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  static _parseBoolean(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  /**
   * Validate API key with optional strict mode
   * 
   * @param {string|null|undefined} value - API key value
   * @param {string} provider - Provider name for error messages
   * @param {boolean} isRequired - Whether the key is required (strict mode)
   * @returns {string|null} API key value or null if optional and missing
   * @throws {Error} If key is required but missing
   */
  static _validateApiKey(value, provider, isRequired = false) {
    if (!value) {
      if (isRequired) {
        throw new Error(
          `${provider} API key is required when using this provider. ` +
          `Please set ${provider.toUpperCase().replace(/\s+/g, '_')}_API_KEY in your .env file.`
        );
      }
      console.warn(`Warning: ${provider} API key not provided (optional)`);
      return null;
    }
    return value;
  }
}

module.exports = EnvironmentLoader;
