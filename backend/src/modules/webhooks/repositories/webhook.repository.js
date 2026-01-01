/**
 * WEBHOOK REPOSITORY
 *
 * Data access layer for webhook configurations and delivery operations.
 * Handles CRUD operations and complex queries for webhooks and deliveries.
 *
 * @module modules/webhooks/repositories/webhook.repository
 */

const { WebhookModel, WebhookDeliveryModel } = require('../models/webhook.model');
const { WEBHOOK_STATUS, WEBHOOK_DELIVERY_STATUS: DELIVERY_STATUS, NUMERIC_LIMITS, CLEANUP, TIME_CONSTANTS, ERROR_CODES } = require('@constants');
const { requireOwnership } = require('@utils');

class WebhookRepository {
  constructor() {
    this.model = WebhookModel;
    this.deliveryModel = WebhookDeliveryModel;
  }

  async createWebhook(webhookData, options = {}) {
    const webhook = new this.model(webhookData);
    return await webhook.save({ session: options.session });
  }

  /**
     * Find webhook by ID
     */
  async findWebhookById(id) {
    return await this.model.findById(id);
  }

  /**
     * Find webhook by ID and user (security check)
     */
  async findWebhookByIdAndUser(id, userId) {
    return await this.model.findOne({
      _id: id,
      userId,
    });
  }

  /**
     * Update webhook by ID
     */
  async updateWebhookById(id, updateData, options = {}) {
    return await this.model.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true, session: options.session },
    );
  }

  /**
     * Delete webhook by ID
     */
  async deleteWebhookById(id, options = {}) {
    return await this.model.findByIdAndDelete(id, { session: options.session });
  }

  /**
     * Find webhooks by user ID with filters
     */
  async findWebhooksByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.events) {
      query.events = { $in: filters.events };
    }

    if (filters.search) {
      query.$or = [
        { name: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
        { url: new RegExp(filters.search, 'i') },
      ];
    }

    let dbQuery = this.model.find(query);

    // Sorting
    if (filters.sort) {
      dbQuery = dbQuery.sort(filters.sort);
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    // Pagination
    if (filters.limit) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    if (filters.skip) {
      dbQuery = dbQuery.skip(filters.skip);
    }

    return await dbQuery.exec();
  }

  /**
     * Count webhooks by user ID with filters
     */
  async countWebhooksByUserId(userId, filters = {}) {
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.events) {
      query.events = { $in: filters.events };
    }

    if (filters.search) {
      query.$or = [
        { name: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
        { url: new RegExp(filters.search, 'i') },
      ];
    }

    return await this.model.countDocuments(query);
  }

  /**
     * Find active webhooks that match an event
     */
  async findActiveWebhooksByEvent(eventType, eventData = {}) {
    return await this.model.findActiveByEvent(eventType, eventData);
  }

  /**
     * Get user's webhook statistics
     */
  async getUserWebhookStats(userId) {
    const stats = await this.model.getUserStats(userId);
    return stats.length > 0 ? stats[0] : {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
    };
  }

  /**
     * Suspend webhook
     */
  async suspendWebhook(id) {
    return await this.updateWebhookById(id, {
      status: WEBHOOK_STATUS.SUSPENDED,
      suspendedAt: new Date(),
    });
  }

  /**
     * Activate webhook
     */
  async activateWebhook(id) {
    return await this.updateWebhookById(id, {
      status: WEBHOOK_STATUS.ACTIVE,
      suspendedAt: null,
    });
  }

  /**
     * Record successful delivery for webhook
     */
  async recordSuccessfulDelivery(webhookId) {
    const webhook = await this.findWebhookById(webhookId);
    if (webhook) {
      webhook.recordSuccessfulDelivery();
      await webhook.save();
    }
    return webhook;
  }

  /**
     * Record failed delivery for webhook
     */
  async recordFailedDelivery(webhookId) {
    const webhook = await this.findWebhookById(webhookId);
    if (webhook) {
      webhook.recordFailedDelivery();
      await webhook.save();
    }
    return webhook;
  }

  /**
     * Update last triggered timestamp
     */
  async updateLastTriggered(webhookId) {
    return await this.updateWebhookById(webhookId, {
      lastTriggeredAt: new Date(),
    });
  }

  // ===== DELIVERY METHODS =====

  /**
     * Create a new webhook delivery attempt
     */
  async createDelivery(deliveryData, options = {}) {
    const delivery = new this.deliveryModel(deliveryData);
    return await delivery.save({ session: options.session });
  }

  /**
     * Find delivery by ID
     */
  async findDeliveryById(id) {
    return await this.deliveryModel.findById(id);
  }

  /**
     * Find delivery by ID and webhook user (security check)
     */
  async findDeliveryByIdAndUser(deliveryId, userId) {
    const delivery = await this.deliveryModel.findById(deliveryId).populate('webhookId');
    if (delivery && delivery.webhookId) {
      if (delivery.webhookId.userId) {
        requireOwnership(delivery.webhookId.userId, userId, 'webhook delivery', ERROR_CODES.FORBIDDEN);
      }
      return delivery;
    }
    return null;
  }

  /**
     * Update delivery by ID
     */
  async updateDeliveryById(id, updateData) {
    return await this.deliveryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );
  }

  /**
     * Find deliveries by webhook ID
     */
  async findDeliveriesByWebhookId(webhookId, filters = {}) {
    const query = { webhookId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.dateFrom) {
      query.createdAt = { ...query.createdAt, $gte: filters.dateFrom };
    }

    if (filters.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: filters.dateTo };
    }

    let dbQuery = this.deliveryModel.find(query);

    // Sorting
    if (filters.sort) {
      dbQuery = dbQuery.sort(filters.sort);
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    // Pagination
    if (filters.limit) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    if (filters.skip) {
      dbQuery = dbQuery.skip(filters.skip);
    }

    return await dbQuery.exec();
  }

  /**
     * Count deliveries by webhook ID
     */
  async countDeliveriesByWebhookId(webhookId, filters = {}) {
    const query = { webhookId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.dateFrom) {
      query.createdAt = { ...query.createdAt, $gte: filters.dateFrom };
    }

    if (filters.dateTo) {
      query.createdAt = { ...query.createdAt, $lte: filters.dateTo };
    }

    return await this.deliveryModel.countDocuments(query);
  }

  /**
     * Find pending deliveries for retry
     */
  async findPendingDeliveries(limit = NUMERIC_LIMITS.BULK_MAX) {
    return await this.deliveryModel.find({
      status: { $in: [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.RETRYING] },
      $or: [
        { nextRetryAt: null },
        { nextRetryAt: { $lte: new Date() } },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('webhookId');
  }

  /**
     * Record delivery attempt
     */
  async recordDeliveryAttempt(deliveryId, statusCode, response, error, duration) {
    const delivery = await this.findDeliveryById(deliveryId);
    if (delivery) {
      delivery.recordAttempt(statusCode, response, error, duration);
      await delivery.save();
      return delivery;
    }
    return null;
  }

  /**
     * Get delivery statistics for webhook
     */
  async getDeliveryStats(webhookId) {
    return await this.deliveryModel.aggregate([
      { $match: { webhookId: webhookId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.SUCCESS] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.FAILED] }, 1, 0] },
          },
          retrying: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.RETRYING] }, 1, 0] },
          },
          exhausted: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.EXHAUSTED] }, 1, 0] },
          },
          avgDuration: { $avg: { $arrayElemAt: ['$attempts.duration', -1] } },
          lastDelivery: { $max: '$deliveredAt' },
        },
      },
    ]);
  }

  /**
     * Bulk operations for deliveries
     */
  async bulkUpdateDeliveries(webhookId, updateData, options = {}) {
    return await this.deliveryModel.updateMany(
      { webhookId },
      updateData,
      { session: options.session }
    );
  }

  /**
     * Clean up old delivery records (older than specified days)
     */
  async cleanupOldDeliveries(daysOld = CLEANUP.WEBHOOK_DELIVERIES_DAYS_OLD) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.deliveryModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: DELIVERY_STATUS.SUCCESS,
    });
  }

  /**
     * Get webhook delivery trends
     */
  async getDeliveryTrends(webhookId, timeframe = 'week') {
    const dateFilter = this.getDateFilter(timeframe);

    return await this.deliveryModel.aggregate([
      { $match: { webhookId: webhookId, createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeframe === 'week' ? '%Y-%U' : '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.SUCCESS] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', DELIVERY_STATUS.FAILED] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id': 1 } },
    ]);
  }

  /**
     * Get date filter for analytics
     */
  getDateFilter(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - TIME_CONSTANTS.MS_PER_DAY);
      case 'week':
        return new Date(now.getTime() - (TIME_CONSTANTS.DAYS_PER_WEEK * TIME_CONSTANTS.MS_PER_DAY));
      case 'month':
        return new Date(now.getTime() - (TIME_CONSTANTS.DAYS_PER_MONTH * TIME_CONSTANTS.MS_PER_DAY));
      case 'quarter':
        return new Date(now.getTime() - (TIME_CONSTANTS.DAYS_PER_QUARTER * TIME_CONSTANTS.MS_PER_DAY));
      default:
        return new Date(now.getTime() - (TIME_CONSTANTS.DAYS_PER_WEEK * TIME_CONSTANTS.MS_PER_DAY));
    }
  }

  /**
     * Search deliveries
     */
  async searchDeliveries(webhookId, searchTerm, options = {}) {
    const query = {
      webhookId,
      $or: [
        { eventType: new RegExp(searchTerm, 'i') },
        { status: new RegExp(searchTerm, 'i') },
      ],
    };

    let dbQuery = this.deliveryModel.find(query);

    if (options.sort) {
      dbQuery = dbQuery.sort(options.sort);
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit);
    }

    return await dbQuery.exec();
  }
}

module.exports = WebhookRepository;

