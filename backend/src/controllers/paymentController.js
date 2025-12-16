/**
 * Payment controller
 * Owner: Backend Leader
 */

class PaymentController {
  static createSubscription(req, res) {
    // TODO: Create subscription
    res.status(501).json({ message: 'Subscriptions not implemented' });
  }

  static handleWebhook(req, res) {
    // TODO: Handle payment webhook
    res.status(501).json({ message: 'Webhooks not implemented' });
  }
}

module.exports = PaymentController;
