const { createClient } = require('redis');
const logger = require('@utils/logger');

let redisClient = null;

/**
 * Get Redis connection configuration for BullMQ
 * Returns a plain object with host, port, and optional password
 * All values are explicitly typed to ensure proper serialization
 */
function getRedisConnectionConfig() {
  const centralizedConfig = require('@config');

  const config = {
    host: centralizedConfig.redis.host,
    port: centralizedConfig.redis.port,
    db: centralizedConfig.redis.db,
    connectTimeout: centralizedConfig.redis.connectTimeout,
  };
  
  if (centralizedConfig.redis.password) {
    config.password = centralizedConfig.redis.password;
  }
  
  return config;
}

async function connectRedis() {
  try {
    const redisConfig = getRedisConnectionConfig();
    const config = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: redisConfig.connectTimeout,
      },
    };

    if (redisConfig.password) {
      config.password = redisConfig.password;
    }

    redisClient = createClient(config);

    redisClient.on('error', (err) => {
      logger.logError(err, {
        operation: 'Redis connection',
      });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connecting', {
        operation: 'Redis connection',
      });
    });

    redisClient.on('ready', async () => {
      // Validate Redis version - ensure we're using Docker Redis (7.0+)
      try {
        const info = await redisClient.info('server');
        const versionMatch = info.match(/redis_version:([\d.]+)/);
        if (versionMatch) {
          const version = versionMatch[1];
          const majorVersion = parseInt(version.split('.')[0], 10);
          
          if (majorVersion < 5) {
            logger.error(`Redis version ${version} is too old. BullMQ requires Redis 5.0+. Please use Docker Redis (redis:7-alpine).`, {
              operation: 'Redis connection',
              version,
              host: redisConfig.host,
              port: redisConfig.port,
            });
            await redisClient.quit();
            throw new Error(`Redis version ${version} is too old. Please ensure Docker Redis container is running (redis:7-alpine).`);
          }
          
          logger.info(`Redis connected successfully (version ${version})`, {
            operation: 'Redis connection',
            version,
            host: redisConfig.host,
            port: redisConfig.port,
          });
        }
      } catch (versionError) {
        logger.error('Redis version validation failed', {
          operation: 'Redis connection',
          error: versionError.message,
        });
        await redisClient.quit();
        throw versionError;
      }
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended', {
        operation: 'Redis connection',
      });
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.logError(error, {
      operation: 'Redis connection',
    });
    throw error;
  }
}

module.exports = {
  connectRedis,
  getRedisConnectionConfig,
};


