/**
 * SERVER ENTRY POINT
 *
 * Enterprise-grade server startup with graceful shutdown and comprehensive error handling.
 * Module aliases are loaded via -r module-alias/register in package.json scripts.
 */

const app = require('./app');
const logger = require('@utils/logger');
const config = require('@config');
const { WORKER } = require('@constants');
const connectDatabase = require('@infrastructure/database.connection');
const { connectRedis, disconnectRedis } = require('@infrastructure/redis.connection');

const PORT = config.server.port;
let server;

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info(`🛑 Received ${signal}, initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP server closed');

      try {
        // Close Redis connection
        await disconnectRedis();
        logger.info('✅ Redis connection closed');

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('✅ Database connection closed');

        logger.info('👋 Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown cleanup', { error: error.message });
        process.exit(1);
      }
    });

    // Force close server after timeout
    setTimeout(() => {
      logger.error('⚠️  Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, WORKER.SHUTDOWN_TIMEOUT_MS);
  } else {
    process.exit(0);
  }
}

/**
 * Start the server with comprehensive error handling
 */
async function startServer() {
  try {
    // Handle process signals for graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection', {
        reason: reason,
        promise: promise,
      });
      process.exit(1);
    });

    // Connect to MongoDB first (required)
    logger.info('📦 Connecting to MongoDB...');
    await connectDatabase();
    logger.info('✅ MongoDB connected successfully');

    // FIX: Drop contaminated index on startup to resolve referral code duplicate errors
    try {
      const mongoose = require('mongoose');
      // We need to access the collection directly as the model might not be registered yet
      const collection = mongoose.connection.db.collection('users');
      // Check if index exists before trying to drop it
      const indexes = await collection.indexes();
      const referralIndex = indexes.find(idx => idx.name === 'referral.referralCode_1');

      if (referralIndex) {
        logger.info('🔧 Dropping legacy unique index "referral.referralCode_1" to fix duplicate key errors...');
        await collection.dropIndex('referral.referralCode_1');
        logger.info('✅ Index "referral.referralCode_1" dropped successfully');
      }
    } catch (err) {
      // Log warning but don't fail startup
      logger.warn('⚠️  Index cleanup check failed (this is expected if collection does not exist):', { error: err.message });
    }

    // Connect to Redis (optional - background jobs may not work without it)
    try {
      logger.info('📦 Connecting to Redis...');
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } catch (redisError) {
      logger.warn('⚠️  Redis connection failed - background jobs will not work', {
        error: redisError.message,
      });
      // Don't exit - server can still run without Redis
    }

    // DEBUG: Temporary endpoint to inspect indexes
    app.get('/v1/debug/indexes', async (req, res) => {
      try {
        const mongoose = require('mongoose');
        const collection = mongoose.connection.db.collection('users');
        const indexes = await collection.indexes();
        res.json({ indexes });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Start the server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.server.isDevelopment ? 'development' : 'production'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/v1/metrics`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('💥 Server error', { error: error.message });
      process.exit(1);
    });

  } catch (error) {
    logger.error('💥 Server startup failed', {
      error: error.message,
      stack: error.stack,
      operation: 'Server startup',
    });
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('💥 Fatal error starting server', { error: error.message });
  process.exit(1);
});

// touch
