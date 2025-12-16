/**
 * Notifications controller
 * Owner: Backend Leader
 */

class NotifyController {
  static getNotifications(req, res) {
    // TODO: Get user notifications
    res.status(501).json({ message: 'Notifications not implemented' });
  }

  static markRead(req, res) {
    // TODO: Mark notification as read
    res.status(501).json({ message: 'Mark as read not implemented' });
  }
}

module.exports = NotifyController;
