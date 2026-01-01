/**
 * AUTH CONTROLLER
 *
 * HTTP request handlers for authentication operations.
 * 
 * @module modules/auth/auth.controller
 */

// ==========================================
// CORE MODULES
// ==========================================
const { HTTP_STATUS } = require('@constants');
const { ResponseFormatter } = require('@utils');

class AuthController {
  constructor(authService) {
    this.service = authService;
  }

  async register(req, res, next) {
    try {
      const result = await this.service.register(req.body);
      const { response, statusCode } = ResponseFormatter.success(result, {
        message: 'User registered successfully. Please check your email for verification.',
        statusCode: HTTP_STATUS.CREATED,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await this.service.login(req.body.email, req.body.password);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const result = await this.service.refresh(req.body.refreshToken);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await this.service.logout(req.userId);
      const { response, statusCode } = ResponseFormatter.success(null, {
        message: 'Logged out successfully',
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await this.service.forgotPassword(req.body.email);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await this.service.resetPassword(req.body.token, req.body.password);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await this.service.verifyEmail(req.params.token);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const result = await this.service.resendVerification(req.userId);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const result = await this.service.getMe(req.userId);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
