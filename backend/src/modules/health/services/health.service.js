/**
 * HEALTH SERVICE
 *
 * System health monitoring and metrics collection.
 * Checks database, Redis, external services, and application status.
 *
 * @module modules/health/services/health.service
 */

const mongoose = require('mongoose');
const os = require('os');
const { performance } = require('perf_hooks');
const config = require('@config');
const { SERVICE_VERSION, HTTP_STATUS, HEALTH_STATUS } = require('@constants');

class HealthService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = { '5xx': 0 };
  }

  /**
     * Increment request counter
     */
  incrementRequestCount() {
    this.requestCount++;
  }

  /**
     * Increment error counter
     */
  incrementErrorCount(statusCode) {
    if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      this.errorCount['5xx']++;
    }
  }

  /**
     * Check database connection
     */
  async checkDatabase() {
    try {
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        return {
          status: HEALTH_STATUS.UNHEALTHY,
          error: 'MongoDB not connected',
          connectionState: mongoose.connection.readyState,
        };
      }

      const startTime = performance.now();

      // Try to ping the database
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        await mongoose.connection.db.command({ ping: 1 });
      }

      const responseTime = performance.now() - startTime;

      return {
        status: HEALTH_STATUS.HEALTHY,
        responseTime: Math.round(responseTime),
        connectionState: mongoose.connection.readyState,
      };
    } catch (error) {
      return {
        status: HEALTH_STATUS.UNHEALTHY,
        error: error.message,
        connectionState: mongoose.connection.readyState,
      };
    }
  }

  /**
     * Check Redis connection (if available)
     */
  async checkRedis() {
    try {
      // In a real implementation, you'd check Redis connection
      // For now, return healthy status
      return {
        status: HEALTH_STATUS.HEALTHY,
        message: 'Redis check not implemented',
      };
    } catch (error) {
      return {
        status: HEALTH_STATUS.UNHEALTHY,
        error: error.message,
      };
    }
  }

  /**
     * Check external services
     */
  async checkExternalServices() {
    const services = {
      openai: { status: 'unknown', message: 'Not implemented' },
      anthropic: { status: 'unknown', message: 'Not implemented' },
      storage: { status: 'unknown', message: 'Not implemented' },
    };

    // In a real implementation, you'd ping external services
    // For now, return unknown status

    return services;
  }

  /**
     * Get basic health status
     */
  async getHealth() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();

    const overallStatus = (database.status === HEALTH_STATUS.HEALTHY && redis.status === HEALTH_STATUS.HEALTHY)
      ? HEALTH_STATUS.HEALTHY
      : HEALTH_STATUS.UNHEALTHY;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: SERVICE_VERSION,
      services: {
        database: database,
        redis: redis,
      },
    };
  }

  /**
     * Get readiness status (can the app serve traffic?)
     */
  async getReadiness() {
    const database = await this.checkDatabase();

    const isReady = database.status === HEALTH_STATUS.HEALTHY;
    const services = {
      database: database,
      redis: await this.checkRedis(),
    };

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      services: services,
    };
  }

  /**
     * Get liveness status (is the app running?)
     */
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
        system: os.loadavg(),
      },
    };
  }

  /**
     * Get detailed metrics (Prometheus-compatible format)
     */
  async getMetrics() {
    const database = await this.checkDatabase();
    const memoryUsage = process.memoryUsage();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Prometheus-compatible format
    const metrics = [
      '# HELP resume_enhancer_uptime_seconds Time the application has been running',
      '# TYPE resume_enhancer_uptime_seconds gauge',
      `resume_enhancer_uptime_seconds ${uptime}`,

      '# HELP resume_enhancer_memory_heap_used_bytes Memory heap used',
      '# TYPE resume_enhancer_memory_heap_used_bytes gauge',
      `resume_enhancer_memory_heap_used_bytes ${memoryUsage.heapUsed}`,

      '# HELP resume_enhancer_memory_heap_total_bytes Memory heap total',
      '# TYPE resume_enhancer_memory_heap_total_bytes gauge',
      `resume_enhancer_memory_heap_total_bytes ${memoryUsage.heapTotal}`,

      '# HELP resume_enhancer_requests_total Total HTTP requests',
      '# TYPE resume_enhancer_requests_total counter',
      `resume_enhancer_requests_total ${this.requestCount}`,

      '# HELP resume_enhancer_errors_5xx_total Total 5xx errors',
      '# TYPE resume_enhancer_errors_5xx_total counter',
      `resume_enhancer_errors_5xx_total ${this.errorCount['5xx']}`,

      '# HELP resume_enhancer_database_response_time_seconds Database response time',
      '# TYPE resume_enhancer_database_response_time_seconds gauge',
      `resume_enhancer_database_response_time_seconds ${database.responseTime ? database.responseTime / 1000 : 0}`,

      '# HELP cv_enhancer_database_status Database connection status (1=healthy, 0=unhealthy)',
      '# TYPE cv_enhancer_database_status gauge',
      `cv_enhancer_database_status ${database.status === HEALTH_STATUS.HEALTHY ? 1 : 0}`,
    ];

    return metrics.join('\n');
  }

  /**
     * Get detailed system information
     */
  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      environment: config.server.nodeEnv,
      pid: process.pid,
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
    };
  }

  /**
     * Get application performance metrics
     */
  getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // ms
        system: Math.round(cpuUsage.system / 1000), // ms
      },
      eventLoop: {
        lag: 0, // Would need additional monitoring library
      },
      garbageCollection: {
        collections: 0, // Would need additional monitoring library
      },
    };
  }

  /**
     * Comprehensive health check with all details
     */
  async getDetailedHealth() {
    const [health, readiness, liveness] = await Promise.all([
      this.getHealth(),
      this.getReadiness(),
      this.getLiveness(),
    ]);

    return {
      summary: {
        status: health.status,
        readiness: readiness.status,
        liveness: liveness.status,
      },
      health,
      readiness,
      liveness,
      system: this.getSystemInfo(),
      performance: this.getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = HealthService;

