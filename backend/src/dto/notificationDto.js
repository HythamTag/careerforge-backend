/**
 * Notification Data Transfer Objects
 * Owner: Backend Leader
 */

class NotificationDto {
  constructor(notification) {
    this.id = notification._id;
    this.type = notification.type;
    this.message = notification.message;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
    this.data = notification.data;
  }
}

class CreateNotificationDto {
  constructor(userId, type, message, data) {
    this.userId = userId;
    this.type = type;
    this.message = message;
    this.data = data;
  }

  validate() {
    if (!this.userId || !this.type || !this.message) {
      throw new Error('userId, type, and message are required');
    }
    return true;
  }
}

class MarkAsReadDto {
  constructor(notificationId) {
    this.notificationId = notificationId;
  }

  validate() {
    if (!this.notificationId) {
      throw new Error('notificationId is required');
    }
    return true;
  }
}

module.exports = {
  NotificationDto,
  CreateNotificationDto,
  MarkAsReadDto
};
