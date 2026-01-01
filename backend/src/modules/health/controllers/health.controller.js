/**
 * HEALTH CONTROLLER
 *
 * HTTP request handlers for health monitoring endpoints.
 *
 * @module modules/health/controllers/health.controller
 */

const { HTTP_STATUS, ERROR_CODES, HEALTH_STATUS, OPERATION_STATUS } = require('@constants');
const { ResponseFormatter } = require('@utils');
const { AppError } = require('@errors');

class HealthController {
  constructor(healthService) {
    this.service = healthService;
  }

  /**
     * Basic health check
     * GET /v1/health
     */
  async getHealth(req, res) {
    try {
      const health = await this.service.getHealth();
      const statusCode = health.status === HEALTH_STATUS.HEALTHY ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
     * Readiness check
     * GET /v1/health/ready
     */
  async getReadiness(req, res) {
    try {
      const readiness = await this.service.getReadiness();
      const statusCode = readiness.status === HEALTH_STATUS.READY ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json(readiness);
    } catch (error) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
     * Liveness check
     * GET /v1/health/live
     */
  async getLiveness(req, res) {
    try {
      const liveness = this.service.getLiveness();
      res.status(HTTP_STATUS.OK).json(liveness);
    } catch (error) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: 'dead',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
     * Prometheus metrics
     * GET /v1/metrics
     */
  async getMetrics(req, res) {
    try {
      const metrics = await this.service.getMetrics();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(HTTP_STATUS.OK).send(metrics);
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
     * Detailed health information
     * GET /v1/health/detailed
     */
  async getDetailedHealth(req, res) {
    try {
      const detailedHealth = await this.service.getDetailedHealth();
      const statusCode = detailedHealth.summary.status === HEALTH_STATUS.HEALTHY ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json(detailedHealth);
    } catch (error) {
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        status: OPERATION_STATUS.ERROR,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
     * System information
     * GET /v1/health/system
     */
  async getSystemInfo(req, res) {
    try {
      const systemInfo = this.service.getSystemInfo();
      const { response, statusCode } = ResponseFormatter.success(systemInfo);

      res.status(statusCode).json(response);
    } catch (error) {
      const appError = new AppError(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.UNKNOWN_ERROR);
      res.status(appError.statusCode).json(ResponseFormatter.error(appError).response);
    }
  }

  /**
     * Performance metrics
     * GET /v1/health/performance
     */
  async getPerformanceMetrics(req, res) {
    try {
      const performanceMetrics = this.service.getPerformanceMetrics();
      const { response, statusCode } = ResponseFormatter.success(performanceMetrics);

      res.status(statusCode).json(response);
    } catch (error) {
      const appError = new AppError(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.UNKNOWN_ERROR);
      res.status(appError.statusCode).json(ResponseFormatter.error(appError).response);
    }
  }
}

module.exports = HealthController;

