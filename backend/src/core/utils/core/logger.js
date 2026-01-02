const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { SERVICE_NAME, STRING_LIMITS } = require('@constants');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Lazy load config to avoid circular dependency
let configCache = null;
const getConfig = () => {
  if (!configCache) {
    configCache = require('@config');
  }
  return configCache;
};

// Get log level from centralized config (single source of truth)
const getLogLevel = () => {
  try {
    const config = getConfig();
    return config.logging.level;
  } catch (error) {
    // Config system must be available - if not, this is a critical error
    throw new Error(`Configuration system not available: ${error.message}`);
  }
};

// Initialize log level lazily
let logLevel = null;
const initializeLogLevel = () => {
  if (!logLevel) {
    logLevel = getLogLevel();
  }
  return logLevel;
};
const baseLogDir = path.join(__dirname, '../../../../logs');
const cvsLogDir = path.join(baseLogDir, 'cvs');
const processId = process.pid;
const processType = process.argv[1]?.includes('worker') ? 'worker' : 'server';

// Directory creation moved inside initialization or handled lazily
const ensureLogDirectories = () => {
  if (!fsSync.existsSync(baseLogDir)) {
    fsSync.mkdirSync(baseLogDir, { recursive: true });
  }
  if (!fsSync.existsSync(cvsLogDir)) {
    fsSync.mkdirSync(cvsLogDir, { recursive: true });
  }
};



// ============================================================================
// SIMPLE CONSOLE FORMAT - CLEAR AND READABLE
// ============================================================================

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    // Build context parts
    const parts = [];
    if (meta.correlationId && meta.correlationId !== 'unknown') {
      parts.push(`CID:${meta.correlationId}`);
    }
    if (meta.cvId) {
      parts.push(`CV:${meta.cvId}`);
    }
    if (meta.jobId) {
      parts.push(`JOB:${meta.jobId}`);
    }
    if (meta.userId) {
      parts.push(`UID:${meta.userId}`);
    }

    const context = parts.length > 0 ? `[${parts.join('|')}] ` : '';
    const prefix = `[${timestamp}] [PID:${processId}] [${processType.toUpperCase()}]`;

    // For errors, include the error details
    let errorInfo = '';
    const err = meta.error || (level === 'error' ? meta : null);

    if (err && typeof err === 'object') {
      const msg = err.message || (typeof err === 'string' ? err : '');
      if (msg && msg !== message) {
        errorInfo += `\n  Details: ${msg}`;
      }
      if (err.code) { errorInfo += `\n  Code: ${err.code}`; }
      if (err.statusCode) { errorInfo += `\n  HTTP: ${err.statusCode}`; }
      if (err.stack) {
        errorInfo += `\n  Stack: ${err.stack}`;
      } else if (meta.stack) {
        errorInfo += `\n  Stack: ${meta.stack}`;
      }
    } else if (meta.stack) {
      errorInfo += `\n  Stack: ${meta.stack}`;
    }

    // Log operation if present
    const operation = meta.operation ? ` [${meta.operation}]` : '';

    return `${prefix} ${level}:${operation} ${context}${message}${errorInfo}`;
  }),
);

// ============================================================================
// FILE FORMAT - JSON FOR STRUCTURED LOGGING
// ============================================================================

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ============================================================================
// WINSTON LOGGER
// ============================================================================

// ============================================================================
// WINSTON LOGGER (Lazy Initialization)
// ============================================================================

let winstonLogger = null;

const createLogger = () => {
  if (!winstonLogger) {
    winstonLogger = winston.createLogger({
      level: initializeLogLevel(),
      format: fileFormat,
      defaultMeta: {
        service: SERVICE_NAME,
        pid: processId,
        processType,
      },
      transports: [
        // Error logs
        new DailyRotateFile({
          filename: path.join(baseLogDir, `${processType}-error-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: getConfig().logging.maxSize,
          maxFiles: getConfig().logging.maxFiles,
          zippedArchive: true,
        }),
        // Combined logs
        new DailyRotateFile({
          filename: path.join(baseLogDir, `${processType}-%DATE%.log`),
          datePattern: 'YYYY-MM-DD',
          maxSize: getConfig().logging.maxSize,
          maxFiles: getConfig().logging.maxFiles,
          zippedArchive: true,
        }),
      ],
    });

    // Add console transport for all environments (Standard for Docker/Cloud/Railway)
    winstonLogger.add(
      new winston.transports.Console({
        format: consoleFormat,
        level: initializeLogLevel(),
      }),
    );
  }
  return winstonLogger;
};

/**
 * Method definitions for the logger instance
 */

const loggerMethods = {
  baseLogDir,
  cvsLogDir,

  withCorrelationId(correlationId) {
    return createLogger().child({ correlationId });
  },

  withCVContext(cvId, jobId) {
    const context = { cvId };
    if (jobId) { context.jobId = jobId; }
    return createLogger().child(context);
  },

  logPerformance(operation, duration, context) {
    const config = getConfig();
    const slowMs = config.performance.slowRequestMs;
    const verySlowMs = config.performance.verySlowRequestMs;
    const level = duration > verySlowMs ? 'warn' : duration > slowMs ? 'info' : 'debug';
    createLogger()[level](`${operation} completed in ${duration}ms`, {
      ...(context ? context : {}),
      operation,
      duration,
    });
  },

  logError(error, context) {
    const errorDetails = {
      message: error.message,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
    };

    const config = getConfig();
    if (!config.server?.isProduction) {
      errorDetails.stack = error.stack;
    }

    createLogger().error(error.message, {
      ...(context ? context : {}),
      error: errorDetails,
    });
  },

  logAI(type, data) {
    const level = type === 'error' ? 'error' : 'info';
    createLogger()[level](`AI ${type}`, {
      operation: `AI ${type}`,
      provider: data.provider,
      model: data.model,
      ...(data.responseLength && { responseLength: data.responseLength }),
      ...(data.tokens && { tokens: data.tokens }),
      ...(data.duration && { duration: data.duration }),
    });
  },

  async createCVLogFolder(cvId, originalFileName, jobId) {
    ensureLogDirectories();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0];
    const cleanFileName = originalFileName
      ? originalFileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, STRING_LIMITS.FILE_NAME_PREVIEW_LENGTH)
      : 'unknown';

    const folderName = `${cvId}_${cleanFileName}_${timestamp}`;
    const cvLogPath = path.join(cvsLogDir, folderName);

    await fs.mkdir(cvLogPath, { recursive: true });

    const metadata = { cvId, originalFileName, jobId, createdAt: new Date().toISOString() };
    await fs.writeFile(path.join(cvLogPath, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

    createLogger().debug(`CV log folder created: ${folderName}`, { operation: 'CV log', cvId, jobId });

    return cvLogPath;
  },

  async logCV(cvLogDir, level, message, data) {
    const logPath = path.join(cvLogDir, 'process.log');
    const timestamp = new Date().toISOString();
    const dataObj = data ? data : {};
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n${Object.keys(dataObj).length > 0 ? JSON.stringify(dataObj, null, 2) + '\n' : ''}`;

    try {
      await fs.appendFile(logPath, logLine);
    } catch (error) {
      // Silently fail
    }

    createLogger()[level](message, { ...dataObj, cvLogDir: path.basename(cvLogDir) });
  },

  async logCVAI(cvLogDir, type, data) {
    const aiLogPath = path.join(cvLogDir, 'ai.log');
    const timestamp = new Date().toISOString();
    const logLine = `\n[${timestamp}] AI ${type.toUpperCase()}\n${JSON.stringify(data, null, 2)}\n`;

    try {
      await fs.appendFile(aiLogPath, logLine);
    } catch (error) {
      // Silently fail
    }

    this.logAI(type, data);
  },

  async logCVResult(cvLogDir, success, result) {
    const resultPath = path.join(cvLogDir, success ? 'result_success.json' : 'result_error.json');

    try {
      await fs.writeFile(resultPath, JSON.stringify({ success, ...result }, null, 2), 'utf8');
    } catch (error) {
      // Silently fail
    }

    if (success) {
      createLogger().info('CV processing completed successfully', { cvId: result.cvId, jobId: result.jobId });
    }
  },

  async saveCVText(cvLogDir, text, fileName) {
    const file = fileName ? fileName : 'extracted_text.txt';
    try {
      await fs.writeFile(path.join(cvLogDir, file), text, 'utf8');
    } catch (error) {
      // Silently fail
    }
  },

  async saveParsedCV(cvLogDir, cvData) {
    try {
      await fs.writeFile(
        path.join(cvLogDir, 'parsed_cv.json'),
        JSON.stringify(cvData, null, 2),
        'utf8',
      );
    } catch (error) {
      // Silently fail
    }
  },

  logOperationError(operation, error, context = {}) {
    createLogger().error(`${operation} failed`, {
      error: error.message,
      ...context,
    });
  },
};

/**
 * PROXY FOR LAZY INITIALIZATION
 *
 * This proxy breaks circular dependencies by deferring winston logger creation
 * until the first log method is actually called.
 */
const loggerProxy = new Proxy(loggerMethods, {
  get(target, prop) {
    // If the method exists in our custom methods, use it
    if (prop in target) {
      return target[prop];
    }

    // Otherwise, ensure winston is initialized and delegate to it
    const winstonLogger = createLogger();
    const value = winstonLogger[prop];

    // If it's a function, bind it to winstonLogger
    return typeof value === 'function' ? value.bind(winstonLogger) : value;
  },
});


// ============================================================================
// EXPORTS
// ============================================================================

module.exports = loggerProxy;


