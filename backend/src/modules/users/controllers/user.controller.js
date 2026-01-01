/**
 * USER CONTROLLER
 *
 * HTTP request handlers for user management.
 *
 * @module modules/users/user.controller
 */

const { ResponseFormatter } = require('@utils');
const { HTTP_STATUS } = require('@constants');

class UserController {
  constructor(userService) {
    this.service = userService;
  }

  async getProfile(req, res, next) {
    try {
      const result = await this.service.getProfile(req.userId);
      const { response, statusCode } = ResponseFormatter.success(result);
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const result = await this.service.updateProfile(req.userId, req.body);
      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      await this.service.changePassword(req.userId, req.body.currentPassword, req.body.newPassword);
      const { response, statusCode } = ResponseFormatter.success(null, {
        message: 'Password changed successfully',
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      const result = await this.service.uploadAvatar(req.userId, req.file);
      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteAvatar(req, res, next) {
    try {
      const result = await this.service.deleteAvatar(req.userId);
      const { response, statusCode } = ResponseFormatter.success(null, {
        message: result.message,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const result = await this.service.getStats(req.userId);
      const { response, statusCode } = ResponseFormatter.success(result.data, {
        links: result._links,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const result = await this.service.deleteAccount(req.userId);
      const { response, statusCode } = ResponseFormatter.success(null, {
        message: result.message,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req, res, next) {
    try {
      const result = await this.service.getSubscription(req.userId);
      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req, res, next) {
    try {
      const result = await this.service.updateSubscription(req.userId, req.body);
      const { response, statusCode } = ResponseFormatter.success(result, {
        links: result._links,
      });
      res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
