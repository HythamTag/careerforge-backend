/**
 * Notifications tests
 * Owner: Backend Leader
 */

const NotificationService = require('../src/services/notificationService');

describe('NotificationService', () => {
  test('should get notifications', () => {
    const userId = 'user123';
    const result = NotificationService.getNotifications(userId);

    expect(Array.isArray(result)).toBe(true);
  });

  test('should mark notification as read', () => {
    const notificationId = 'notif123';
    const result = NotificationService.markAsRead(notificationId);

    expect(result).toBe(true);
  });
});
