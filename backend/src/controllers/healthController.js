/**
 * Health check controller
 * Owner: Backend Leader
 */

class HealthController {
  static getHealth(req, res) {
    res.status(200).json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: 'pending',
        redis: 'pending'
      }
    });
  }
}

module.exports = HealthController;
