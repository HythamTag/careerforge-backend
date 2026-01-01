const mongoose = require('mongoose');
const logger = require('@utils/logger');
const config = require('@config');

async function connectDatabase() {
  try {
    const options = {
      maxPoolSize: config.database.options.maxPoolSize,
      serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.database.options.socketTimeoutMS,
    };

    await mongoose.connect(config.database.mongodbUri, options);

    mongoose.connection.on('error', (err) => {
      logger.logError(err, {
        operation: 'MongoDB connection',
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', {
        operation: 'MongoDB connection',
      });
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', {
        operation: 'MongoDB connection',
      });
    });

    return mongoose.connection;
  } catch (error) {
    logger.logError(error, {
      operation: 'MongoDB connection',
    });
    throw error;
  }
}

module.exports = connectDatabase;


