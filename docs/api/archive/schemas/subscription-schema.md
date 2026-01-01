# Subscription Schema

## Subscription Object

Complete subscription information including plan details, billing, usage tracking, and entitlements.

### Subscription Status Values

- **`free`**: No payment, limited features
- **`trial`**: Free trial period active
- **`active`**: Subscription is active and paid
- **`cancelled`**: Subscription cancelled
- **`expired`**: Subscription expired
- **`past_due`**: Payment overdue

### Plan Types

- **`free`**: Limited features, no payment required
- **`basic`**: Entry-level paid plan with core features
- **`pro`**: Full-featured plan for power users
- **`enterprise`**: Custom enterprise plan with advanced features

### Examples by Status

#### Active Premium Subscription
```json
{
  "id": "sub_premium_active123",
  "userId": "user_active123",
  "plan": "premium",
  "status": "active",
  "billingCycle": "monthly",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "amount": 29.99,
  "currency": "USD",
  "features": {
    "maxResumes": 100,
    "maxStorageBytes": 1073741824,
    "monthlyJobCredits": 500,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true
  },
  "usage": {
    "resumesCreated": 23,
    "storageUsedBytes": 52428800,
    "jobsExecuted": 145,
    "apiCalls": 1250,
    "resetDate": "2024-02-01T00:00:00.000Z"
  },
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2025
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Trialing Subscription
```json
{
  "id": "sub_trial_new456",
  "userId": "user_trial456",
  "plan": "premium",
  "status": "trial",
  "billingCycle": "monthly",
  "trialStart": "2024-01-01T00:00:00.000Z",
  "trialEnd": "2024-01-15T00:00:00.000Z",
  "daysLeftInTrial": 7,
  "cancelAtPeriodEnd": false,
  "features": {
    "maxResumes": 100,
    "maxStorageBytes": 1073741824,
    "monthlyJobCredits": 500,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true
  },
  "usage": {
    "resumesCreated": 5,
    "storageUsedBytes": 10485760,
    "jobsExecuted": 25,
    "apiCalls": 150,
    "resetDate": "2024-01-15T00:00:00.000Z"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-08T14:20:00.000Z"
}
```

#### Past Due Subscription
```json
{
  "id": "sub_pastdue_old789",
  "userId": "user_pastdue789",
  "plan": "premium",
  "status": "past_due",
  "billingCycle": "monthly",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "amount": 29.99,
  "currency": "USD",
  "pastDueAmount": 29.99,
  "pastDueDate": "2024-01-05T00:00:00.000Z",
  "gracePeriodEnds": "2024-01-20T00:00:00.000Z",
  "features": {
    "maxResumes": 100,
    "maxStorageBytes": 1073741824,
    "monthlyJobCredits": 500,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true,
    "restricted": true
  },
  "usage": {
    "resumesCreated": 45,
    "storageUsedBytes": 209715200,
    "jobsExecuted": 320,
    "apiCalls": 2500,
    "resetDate": "2024-02-01T00:00:00.000Z"
  },
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2024,
    "requiresUpdate": true
  },
  "createdAt": "2023-12-01T00:00:00.000Z",
  "updatedAt": "2024-01-05T00:00:00.000Z"
}
```

#### Canceled Subscription (Still Active)
```json
{
  "id": "sub_cancelled_stillactive012",
  "userId": "user_cancelled012",
  "plan": "premium",
  "status": "cancelled",
  "billingCycle": "monthly",
  "currentPeriodStart": "2024-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
  "cancelAtPeriodEnd": true,
  "cancelledAt": "2024-01-10T15:30:00.000Z",
  "cancelReason": "cost",
  "reactivationOffered": true,
  "features": {
    "maxResumes": 100,
    "maxStorageBytes": 1073741824,
    "monthlyJobCredits": 500,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true
  },
  "usage": {
    "resumesCreated": 67,
    "storageUsedBytes": 314572800,
    "jobsExecuted": 450,
    "apiCalls": 3800,
    "resetDate": "2024-02-01T00:00:00.000Z"
  },
  "createdAt": "2023-10-01T00:00:00.000Z",
  "updatedAt": "2024-01-10T15:30:00.000Z"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Globally unique subscription identifier (format: `sub_{plan}_{random}`) |
| userId | string | Yes | Associated user identifier |
| plan | string | Yes | Subscription plan: `free`, `basic`, `pro`, `enterprise` |
| status | string | Yes | Subscription status: `free`, `trial`, `active`, `cancelled`, `expired`, `past_due` |
| billingCycle | string | No | Billing cycle: `monthly`, `yearly`, `quarterly` |
| currentPeriodStart | string | No | ISO 8601 start of current billing period |
| currentPeriodEnd | string | No | ISO 8601 end of current billing period |
| trialStart | string | No | ISO 8601 trial period start (for trialing status) |
| trialEnd | string | No | ISO 8601 trial period end (for trialing status) |
| daysLeftInTrial | integer | No | Days remaining in trial (for trialing status) |
| cancelAtPeriodEnd | boolean | No | Whether subscription will cancel at period end |
| cancelledAt | string | No | ISO 8601 cancellation timestamp |
| cancelReason | string | No | Cancellation reason: `cost`, `features`, `competitor`, `temporary`, `other` |
| reactivationOffered | boolean | No | Whether reactivation offer is available |
| amount | number | No | Subscription amount per billing cycle |
| currency | string | No | Currency code (ISO 4217): `USD`, `EUR`, `GBP`, etc. |
| pastDueAmount | number | No | Amount currently past due |
| pastDueDate | string | No | ISO 8601 when payment became past due |
| gracePeriodEnds | string | No | ISO 8601 when grace period expires |
| features | object | Yes | Plan feature entitlements |
| features.maxResumes | integer | Yes | Maximum number of resumes allowed |
| features.maxStorageBytes | integer | Yes | Maximum storage in bytes |
| features.monthlyJobCredits | integer | No | Monthly AI job credits |
| features.prioritySupport | boolean | No | Priority customer support access |
| features.advancedTemplates | boolean | No | Access to premium templates |
| features.bulkOperations | boolean | No | Bulk operation capabilities |
| features.apiAccess | boolean | No | API access enabled |
| features.webhooks | boolean | No | Webhook functionality |
| features.analytics | boolean | No | Advanced analytics access |
| features.customIntegrations | boolean | No | Custom integration support |
| features.whiteLabeling | boolean | No | White-labeling capabilities |
| features.restricted | boolean | No | Features restricted due to payment status |
| usage | object | No | Current usage statistics |
| usage.resumesCreated | integer | No | Resumes created in current period |
| usage.storageUsedBytes | integer | No | Storage used in current period |
| usage.jobsExecuted | integer | No | Jobs executed in current period |
| usage.apiCalls | integer | No | API calls made in current period |
| usage.resetDate | string | No | ISO 8601 when usage counters reset |
| paymentMethod | object | No | Primary payment method |
| paymentMethod.type | string | No | Payment method type: `card`, `paypal`, `bank` |
| paymentMethod.last4 | string | No | Last 4 digits (for cards) |
| paymentMethod.brand | string | No | Card brand: `visa`, `mastercard`, `amex` |
| paymentMethod.expiryMonth | integer | No | Expiry month (1-12) |
| paymentMethod.expiryYear | integer | No | Expiry year |
| paymentMethod.requiresUpdate | boolean | No | Payment method needs updating |
| createdAt | string | Yes | ISO 8601 subscription creation timestamp |
| updatedAt | string | Yes | ISO 8601 last update timestamp |

---

## Subscription Update Request

```json
{
  "plan": "premium",
  "billingCycle": "monthly"
}
```

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plan | string | Yes | Subscription plan: `free`, `basic`, `premium` |
| billingCycle | string | No | Billing cycle: `monthly`, `yearly` |

---

## Subscription Plans

Detailed specifications for all available subscription plans with pricing, features, and limitations.

### Free Plan

Basic plan for getting started with limited features.

```json
{
  "id": "plan_free",
  "name": "Free",
  "description": "Perfect for trying out CV Enhancer",
  "category": "individual",
  "pricing": {
    "monthly": 0,
    "yearly": 0,
    "currency": "USD"
  },
  "trial": {
    "enabled": false
  },
  "features": {
    "maxResumes": 3,
    "maxStorageBytes": 104857600,
    "monthlyJobCredits": 10,
    "prioritySupport": false,
    "advancedTemplates": false,
    "bulkOperations": false,
    "apiAccess": false,
    "webhooks": false,
    "analytics": false,
    "customIntegrations": false,
    "whiteLabeling": false,
    "maxFileSizeBytes": 10485760,
    "supportedFormats": ["pdf", "docx"],
    "exportFormats": ["pdf"]
  },
  "limits": {
    "maxJobsPerDay": 5,
    "maxApiCallsPerDay": 100,
    "maxWebhooksPerUser": 0,
    "rateLimitPerMinute": 10
  },
  "restrictions": [
    "Watermarked exports",
    "Limited template selection",
    "No API access",
    "Basic support only"
  ]
}
```

### Basic Plan

Entry-level paid plan with core features for individual users.

```json
{
  "id": "plan_basic",
  "name": "Basic",
  "description": "Essential features for job seekers",
  "category": "individual",
  "pricing": {
    "monthly": 9.99,
    "yearly": 99.99,
    "currency": "USD",
    "yearlyDiscount": 17
  },
  "trial": {
    "enabled": true,
    "durationDays": 14,
    "creditCardRequired": false
  },
  "features": {
    "maxResumes": 20,
    "maxStorageBytes": 524288000,
    "monthlyJobCredits": 50,
    "prioritySupport": false,
    "advancedTemplates": false,
    "bulkOperations": false,
    "apiAccess": false,
    "webhooks": false,
    "analytics": true,
    "customIntegrations": false,
    "whiteLabeling": false,
    "maxFileSizeBytes": 20971520,
    "supportedFormats": ["pdf", "docx", "doc"],
    "exportFormats": ["pdf", "docx"]
  },
  "limits": {
    "maxJobsPerDay": 25,
    "maxApiCallsPerDay": 500,
    "maxWebhooksPerUser": 0,
    "rateLimitPerMinute": 30
  },
  "restrictions": [
    "No priority support",
    "Limited template selection"
  ]
}
```

### Premium Plan

Full-featured plan for serious job seekers and professionals.

```json
{
  "id": "plan_premium",
  "name": "Premium",
  "description": "Complete toolkit for career advancement",
  "category": "individual",
  "pricing": {
    "monthly": 29.99,
    "yearly": 299.99,
    "currency": "USD",
    "yearlyDiscount": 17
  },
  "trial": {
    "enabled": true,
    "durationDays": 30,
    "creditCardRequired": true
  },
  "features": {
    "maxResumes": 100,
    "maxStorageBytes": 2147483648,
    "monthlyJobCredits": 500,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true,
    "customIntegrations": false,
    "whiteLabeling": false,
    "maxFileSizeBytes": 52428800,
    "supportedFormats": ["pdf", "docx", "doc", "txt"],
    "exportFormats": ["pdf", "docx", "html", "json"]
  },
  "limits": {
    "maxJobsPerDay": 200,
    "maxApiCallsPerDay": 5000,
    "maxWebhooksPerUser": 10,
    "rateLimitPerMinute": 120
  },
  "restrictions": []
}
```

### Enterprise Plan

Custom enterprise solution with advanced features and support.

```json
{
  "id": "plan_enterprise",
  "name": "Enterprise",
  "description": "Custom solution for organizations and teams",
  "category": "organization",
  "pricing": {
    "monthly": "Contact Sales",
    "yearly": "Contact Sales",
    "currency": "USD",
    "customPricing": true
  },
  "trial": {
    "enabled": true,
    "durationDays": 60,
    "customTerms": true
  },
  "features": {
    "maxResumes": -1,
    "maxStorageBytes": -1,
    "monthlyJobCredits": -1,
    "prioritySupport": true,
    "advancedTemplates": true,
    "bulkOperations": true,
    "apiAccess": true,
    "webhooks": true,
    "analytics": true,
    "customIntegrations": true,
    "whiteLabeling": true,
    "maxFileSizeBytes": 104857600,
    "supportedFormats": ["pdf", "docx", "doc", "txt", "rtf"],
    "exportFormats": ["pdf", "docx", "html", "json", "xml"]
  },
  "limits": {
    "maxJobsPerDay": -1,
    "maxApiCallsPerDay": -1,
    "maxWebhooksPerUser": 100,
    "rateLimitPerMinute": 1000
  },
  "restrictions": [],
  "enterpriseFeatures": [
    "SSO Integration",
    "Custom Branding",
    "Advanced Analytics",
    "Dedicated Support",
    "Custom Templates",
    "Team Management",
    "Audit Logs",
    "Compliance Tools"
  ]
}
```

## Upgrade/Downgrade Scenarios

### Upgrade from Free to Premium

```json
{
  "action": "upgrade",
  "fromPlan": "free",
  "toPlan": "premium",
  "billingCycle": "monthly",
  "proration": {
    "currentPlanAmount": 0,
    "newPlanAmount": 29.99,
    "prorationAmount": 29.99,
    "prorationDate": "2024-01-15T00:00:00.000Z",
    "nextBillingDate": "2024-02-15T00:00:00.000Z"
  },
  "featureChanges": {
    "added": [
      "Advanced Templates",
      "API Access",
      "Priority Support",
      "Bulk Operations"
    ],
    "removed": [],
    "limits": {
      "maxResumes": "3 → 100",
      "storage": "100MB → 2GB",
      "jobCredits": "10 → 500"
    }
  },
  "immediateEffect": true
}
```

### Downgrade from Premium to Basic

```json
{
  "action": "downgrade",
  "fromPlan": "premium",
  "toPlan": "basic",
  "billingCycle": "monthly",
  "scheduledChange": {
    "effectiveDate": "2024-02-01T00:00:00.000Z",
    "reason": "cost_savings"
  },
  "featureChanges": {
    "added": [],
    "removed": [
      "Advanced Templates",
      "API Access",
      "Priority Support",
      "Bulk Operations"
    ],
    "limits": {
      "maxResumes": "100 → 20",
      "storage": "2GB → 500MB",
      "jobCredits": "500 → 50"
    }
  },
  "immediateEffect": false,
  "gracePeriod": {
    "exportDataUntil": "2024-02-15T00:00:00.000Z",
    "featureAccessUntil": "2024-02-01T00:00:00.000Z"
  }
}
```

### Plan Change Validation Rules

- **Free → Any Paid**: Immediate upgrade, proration applied
- **Paid → Higher Tier**: Immediate upgrade, proration applied
- **Paid → Lower Tier**: Scheduled for next billing cycle, features remain until then
- **Enterprise**: Custom terms, contact sales required
- **Trial → Paid**: Seamless conversion, billing starts immediately
- **Past Due → Upgrade**: Payment required before upgrade
- **Canceled → Reactivate**: Original plan restored, new billing cycle

---

