/**
 * APPLICATION CONFIGURATION
 *
 * Server, file limits, rate limiting, ATS scoring, logging, performance, monitoring, and external configurations.
 */

class AppConfig {
  static getConfig(env) {
    return {
      // ==========================================
      // SERVER CONFIGURATION
      // ==========================================
      server: {
        host: env.HOST,
        port: env.PORT,
        baseUrl: env.BASE_URL,
        env: env.NODE_ENV,
        nodeEnv: env.NODE_ENV,
        isProduction: env.NODE_ENV === 'production',
        isDevelopment: env.NODE_ENV === 'development',
        isTest: env.NODE_ENV === 'test',
      },

      // ==========================================
      // PUPPETEER CONFIGURATION
      // ==========================================
      puppeteer: {
        wsEndpoint: env.PUPPETEER_WS_ENDPOINT,
        executablePath: env.PUPPETEER_EXECUTABLE_PATH,
      },

      // ==========================================
      // CV CONFIGURATION
      // ==========================================
      cv: {
        publicBaseUrl: env.CV_PUBLIC_BASE_URL,
      },

      // ==========================================
      // FILE PROCESSING LIMITS
      // ==========================================
      fileLimits: {
        maxSize: env.MAX_FILE_SIZE,
        maxPages: env.MAX_PAGES,
        allowedMimeTypes: env.ALLOWED_MIME_TYPES,
        allowedExtensions: ['.pdf'],
      },

      // ==========================================
      // RATE LIMITING CONFIGURATION
      // ==========================================
      rateLimit: {
        uploads: env.RATE_LIMIT_UPLOADS,
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      },

      // ==========================================
      // LOGGING CONFIGURATION
      // ==========================================
      logging: {
        level: env.LOG_LEVEL,
        maxSize: env.LOG_MAX_SIZE,
        maxFiles: env.LOG_MAX_FILES,
        format: env.NODE_ENV === 'production' ? 'json' : 'dev',
        correlationId: {
          enabled: true,
          headerName: 'x-correlation-id',
        },
      },

      // ==========================================
      // PERFORMANCE CONFIGURATION
      // ==========================================
      performance: {
        slowRequestMs: env.SLOW_REQUEST_THRESHOLD,
        verySlowRequestMs: env.VERY_SLOW_REQUEST_THRESHOLD,
        compression: {
          enabled: true,
          level: env.COMPRESSION_LEVEL,
          threshold: env.COMPRESSION_THRESHOLD,
        },
        caching: {
          enabled: true,
          maxAge: env.CACHE_MAX_AGE,
        },
      },

      // ==========================================
      // MONITORING & METRICS
      // ==========================================
      monitoring: {
        enabled: env.ENABLE_METRICS,
        port: env.METRICS_PORT,
        healthCheck: {
          enabled: true,
          interval: env.HEALTH_CHECK_INTERVAL,
          timeout: env.HEALTH_CHECK_TIMEOUT,
        },
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          ready: '/ready',
          live: '/live',
        },
      },

      // ==========================================
      // EXTERNAL SERVICE CONFIGURATION
      // ==========================================
      external: {
        httpTimeout: env.HTTP_TIMEOUT,
        retryPolicy: {
          maxRetries: env.RETRY_POLICY_MAX_RETRIES,
          backoffMultiplier: env.RETRY_POLICY_BACKOFF_MULTIPLIER,
          initialDelay: env.RETRY_POLICY_INITIAL_DELAY,
        },
      },
    };
  }

}

module.exports = AppConfig;
