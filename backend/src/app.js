/**
 * EXPRESS APPLICATION
 *
 * Enterprise-grade Express app with full middleware chain.
 */

// Load module aliases
require('module-alias/register');

// ==========================================
// EXTERNAL DEPENDENCIES
// ==========================================
const express = require('express');
const cors = require('cors');

// ==========================================
// CORE MODULES (Module Aliases)
// ==========================================
const logger = require('@utils/logger');
const config = require('@config');
const { HTTP_STATUS } = require('@constants');
const { resolve } = require('@core/container');

// ==========================================
// MIDDLEWARE
// ==========================================
const {
  errorMiddleware,
  responseMiddleware,
  sanitizeMiddleware,
  securityMiddleware,
  correlationMiddleware,
  requestLoggerMiddleware,
  versionMiddleware,
} = require('@middleware');

const app = express();

// ==========================================
// SECURITY & TRUST PROXY (FIRST)
// ==========================================
app.set('trust proxy', 1); // Trust first proxy for rate limiting and IP detection

// Health Check - Mounted early to bypass auth/versioning
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==========================================
// CORS CONFIGURATION
// ==========================================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = config.security.cors.allowedOrigins;

    // In development, allow all localhost origins
    if (config.server.isDevelopment) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: HTTP_STATUS.OK,
};
app.use(cors(corsOptions));

// ==========================================
// SECURITY HEADERS (EARLY)
// ==========================================
app.use(securityMiddleware);

// ==========================================
// BODY PARSING & SANITIZATION
// ==========================================
app.use(express.json({
  limit: config.fileLimits.maxSize,
  strict: true, // Only accept arrays and objects
}));
app.use(express.urlencoded({
  extended: true,
  limit: config.fileLimits.maxSize,
}));
app.use(sanitizeMiddleware);

// ==========================================
// REQUEST TRACING & MONITORING
// ==========================================
// Correlation ID for request tracing
app.use(correlationMiddleware);

// API Version detection and validation
app.use(versionMiddleware);

// Request logging with performance metrics
app.use(requestLoggerMiddleware);

// ==========================================
// RESPONSE FORMATTING
// ==========================================
app.use(responseMiddleware);




// ==========================================
// API MODULES (v1)
// ==========================================
const AuthModule = require('@modules/auth');
const UsersModule = require('@modules/users');
const CvsModule = require('@modules/cvs');
const CvGenerationModule = require('@modules/cv-generation');
const CvAtsModule = require('@modules/cv-ats');
const CvParsingModule = require('@modules/cv-parsing');
const CvOptimizerModule = require('@modules/cv-optimizer');
const JobsModule = require('@modules/jobs');
const HealthModule = require('@modules/health');
const WebhooksModule = require('@modules/webhooks');

// Register v1 API modules
app.use('/v1/auth', AuthModule.routes);
app.use('/v1/users', UsersModule.routes);
app.use('/v1/cvs', CvsModule.routes);
app.use('/v1/generation', CvGenerationModule.routes);
app.use('/v1/cv-ats', CvAtsModule.routes);
app.use('/v1/parse', CvParsingModule.routes);
app.use('/v1/optimize', CvOptimizerModule.routes);
app.use('/v1/jobs', JobsModule.routes);
app.use('/v1/health', HealthModule.routes);
app.use('/v1/webhooks', WebhooksModule.routes);

// ==========================================
// METRICS ENDPOINT (Prometheus format)
// ==========================================
const HealthController = require('@modules/health/controllers/health.controller');
const healthController = new HealthController(resolve('healthService'));
app.get('/v1/metrics', healthController.getMetrics.bind(healthController));

// Using /v1/ API versioning exclusively

// MANUAL FIX: Endpoint to force drop legacy index (TEMPORARY)
app.delete('/v1/debug/fix-index', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    // Ensure connection is established
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const collection = mongoose.connection.db.collection('users');
    const indexName = 'referral.referralCode_1';

    // CHeck if exists
    const indexes = await collection.indexes();
    const exists = indexes.find(idx => idx.name === indexName);

    if (exists) {
      await collection.dropIndex(indexName);
      return res.json({ success: true, message: `Index ${indexName} dropped.` });
    } else {
      return res.json({ success: true, message: `Index ${indexName} not found (already dropped).` });
    }
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// 404 Handler
app.all('*', (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

// Error Handler
app.use(errorMiddleware);

module.exports = app;

