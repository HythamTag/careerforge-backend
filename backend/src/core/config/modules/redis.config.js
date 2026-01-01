/**
 * REDIS CONFIGURATION
 *
 * Redis connection and caching configuration.
 */

class RedisConfig {
  static getConfig(env) {
    return {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      connectTimeout: env.REDIS_CONNECT_TIMEOUT,
      lazyConnect: env.REDIS_LAZY_CONNECT,
      retryDelayOnFailover: env.REDIS_RETRY_DELAY_ON_FAILOVER,
      maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST,
    };
  }
}

module.exports = RedisConfig;
