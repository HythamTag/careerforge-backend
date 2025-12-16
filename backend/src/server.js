const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/database');
const helmetConfig = require('./middleware/security/helmetConfig');
const { apiLimiter } = require('./middleware/security/rateLimiter');
const sanitizeInput = require('./middleware/security/sanitizeInput');
const errorHandler = require('./middleware/error/errorHandler');
const logger = require('./middleware/logging/logger');

const app = express();

app.set('trust proxy', 1);

app.use(helmetConfig);

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
});

app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  });

module.exports = app;
