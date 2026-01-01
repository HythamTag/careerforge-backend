#!/usr/bin/env node

/**
 * Test server that runs CV Enhancer without Redis dependency
 * Uses in-memory job processing for testing
 */

require('dotenv').config();
require('./src/config/env');

// Override Redis config to use a mock
const redisConfig = require('./src/config/redis');
redisConfig.connectRedis = async () => {
  console.log('🟡 Using mock Redis for testing');
  return {
    ping: () => 'PONG',
    quit: () => Promise.resolve(),
  };
};
redisConfig.getRedisClient = () => ({
  ping: () => 'PONG',
  quit: () => Promise.resolve(),
});

// Mock BullMQ jobs
const mockQueue = {
  add: async (data, options) => {
    console.log('📋 Mock job added:', data.cvId || 'unknown', options?.jobId || 'no-job-id');
    return { id: options?.jobId || `mock-job-${Date.now()}` };
  },
};

require('./src/jobs/cv-parse.job').mockImplementation = () => mockQueue;
require('./src/jobs/cv-optimize.job').mockImplementation = () => mockQueue;

// Now start the server
const app = require('./src/app');
const logger = require('./src/utils/logger');
const connectDatabase = require('./src/config/database');
const { initializeAIProvider } = require('./src/config/ai');
const { initializeS3 } = require('./src/config/storage');

const PORT = process.env.PORT || 5000;

async function startTestServer() {
  try {
    console.log('🧪 Starting CV Enhancer Test Server');
    console.log('=====================================');

    // Initialize services (skip Redis)
    initializeAIProvider();
    initializeS3();

    console.log('🔄 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');

    console.log('🟡 Redis connection mocked (no Redis required)');
    console.log('📋 Job queues mocked (in-memory processing)');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Test server running on port ${PORT}`);
      console.log('🌐 Frontend: http://localhost:5173');
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📤 Ready to test CV upload!');
      console.log('Upload \'Hytham Tag CV.pdf\' to test the system');
      console.log('=====================================');
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received: closing test server`);
      server.close(() => {
        console.log('✅ Test server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();