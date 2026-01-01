/**
 * DATABASE CONFIGURATION
 *
 * MongoDB connection and database configuration.
 */

class DatabaseConfig {
  static getConfig(env) {
    return {
      mongodbUri: env.MONGODB_URI,
      dbName: env.DB_NAME,
      connectionTimeout: env.DATABASE_TIMEOUT,
      options: {
        maxPoolSize: env.DATABASE_MAX_POOL_SIZE,
        serverSelectionTimeoutMS: env.DATABASE_SERVER_SELECTION_TIMEOUT,
        socketTimeoutMS: env.DATABASE_SOCKET_TIMEOUT,
        bufferMaxEntries: env.DATABASE_BUFFER_MAX_ENTRIES,
        bufferCommands: env.DATABASE_BUFFER_COMMANDS,
      },
    };
  }
}

module.exports = DatabaseConfig;
