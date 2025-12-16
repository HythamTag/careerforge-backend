/**
 * Subscription service
 * Owner: Backend Leader
 */

class SubscriptionService {
  static validateSubscription(userId) {
    // TODO: Check if user has active subscription
    return true;
  }

  static getSubscriptionLimits(planType) {
    // TODO: Return limits based on plan
    return { resumes: 10, ats_checks: 50 };
  }
}

module.exports = SubscriptionService;
