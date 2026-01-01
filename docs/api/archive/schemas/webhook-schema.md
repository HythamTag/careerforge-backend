# Webhook Schema

## Webhook Object

Complete webhook configuration with delivery tracking and security settings.

### Webhook Status Values

- **`active`**: Webhook is operational and receiving events
- **`inactive`**: Webhook disabled by user
- **`suspended`**: Webhook temporarily suspended
- **`failed`**: Webhook disabled due to repeated delivery failures

### Event Types

#### Job Events
- **`job.created`**: Job created and queued
- **`job.started`**: Job processing started
- **`job.completed`**: Job completed successfully
- **`job.failed`**: Job failed
- **`job.cancelled`**: Job cancelled by user

#### Generation Events
- **`generation.completed`**: Resume generation completed
- **`generation.failed`**: Resume generation failed

#### Enhancement Events
- **`enhancement.completed`**: Resume enhancement completed
- **`enhancement.failed`**: Resume enhancement failed

#### ATS Analysis Events
- **`ats.completed`**: ATS analysis completed
- **`ats.failed`**: ATS analysis failed

#### Resume Events
- **`resume.created`**: Resume created
- **`resume.updated`**: Resume updated
- **`resume.deleted`**: Resume deleted

#### User Events
- **`user.registered`**: User account registered
- **`user.updated`**: User profile updated

### Examples by Status

#### Active Webhook (All Events)
```json
{
  "id": "webhook_active123",
  "url": "https://api.example.com/webhooks/cv-enhancer",
  "events": [
    "resume.created",
    "resume.updated",
    "job.completed",
    "job.failed",
    "version.created"
  ],
  "status": "active",
  "secret": "whsec_webhook_secret_key_for_signature_validation",
  "description": "Production webhook for CV processing notifications",
  "retryPolicy": {
    "maxRetries": 5,
    "backoffMultiplier": 2.0,
    "maxBackoffSeconds": 300
  },
  "rateLimit": {
    "maxEventsPerMinute": 60,
    "burstLimit": 10
  },
  "security": {
    "signatureAlgorithm": "sha256",
    "signatureHeader": "X-Webhook-Signature",
    "trustedIPs": ["192.168.1.0/24"]
  },
  "statistics": {
    "totalDeliveries": 1250,
    "successfulDeliveries": 1240,
    "failedDeliveries": 10,
    "averageResponseTimeMs": 245
  },
  "lastDeliveryAt": "2024-01-15T14:30:00.000Z",
  "lastFailureAt": "2024-01-15T12:15:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

#### Suspended Webhook (Too Many Failures)
```json
{
  "id": "webhook_suspended456",
  "url": "https://broken-endpoint.example.com/webhook",
  "events": ["resume.created", "job.completed"],
  "status": "suspended",
  "suspendedAt": "2024-01-15T12:15:00.000Z",
  "suspensionReason": "repeated_failures",
  "failureCount": 25,
  "lastFailureAt": "2024-01-15T12:15:00.000Z",
  "lastFailureError": "Connection timeout after 30 seconds",
  "retryAfter": "2024-01-15T13:15:00.000Z",
  "statistics": {
    "totalDeliveries": 100,
    "successfulDeliveries": 75,
    "failedDeliveries": 25,
    "averageResponseTimeMs": null
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T12:15:00.000Z"
}
```

#### Disabled Webhook (User Action)
```json
{
  "id": "webhook_disabled789",
  "url": "https://old-endpoint.example.com/webhook",
  "events": ["resume.created"],
  "status": "disabled",
  "disabledAt": "2024-01-10T09:00:00.000Z",
  "disabledReason": "user_disabled",
  "statistics": {
    "totalDeliveries": 500,
    "successfulDeliveries": 495,
    "failedDeliveries": 5,
    "averageResponseTimeMs": 180
  },
  "createdAt": "2023-12-01T00:00:00.000Z",
  "updatedAt": "2024-01-10T09:00:00.000Z"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Globally unique webhook identifier (format: `webhook_{random}`) |
| url | string | Yes | HTTPS webhook endpoint URL (must be accessible) |
| events | array | Yes | Array of event types to subscribe to (see Event Types above) |
| status | string | Yes | Webhook status: `active`, `suspended`, `disabled`, `failed` |
| secret | string | No | Secret key for webhook signature validation (auto-generated if not provided) |
| description | string | No | Human-readable description of webhook purpose |
| retryPolicy | object | No | Retry configuration for failed deliveries |
| retryPolicy.maxRetries | integer | No | Maximum retry attempts (default: 5) |
| retryPolicy.backoffMultiplier | number | No | Exponential backoff multiplier (default: 2.0) |
| retryPolicy.maxBackoffSeconds | integer | No | Maximum backoff time in seconds (default: 300) |
| rateLimit | object | No | Rate limiting configuration |
| rateLimit.maxEventsPerMinute | integer | No | Maximum events per minute (default: 60) |
| rateLimit.burstLimit | integer | No | Burst allowance (default: 10) |
| security | object | No | Security and validation settings |
| security.signatureAlgorithm | string | No | Signature algorithm: `sha256` (default) |
| security.signatureHeader | string | No | HTTP header for signature (default: `X-Webhook-Signature`) |
| security.trustedIPs | array | No | Array of trusted IP ranges/CIDRs |
| statistics | object | No | Delivery statistics |
| statistics.totalDeliveries | integer | No | Total delivery attempts |
| statistics.successfulDeliveries | integer | No | Successful deliveries |
| statistics.failedDeliveries | integer | No | Failed deliveries |
| statistics.averageResponseTimeMs | integer | No | Average response time in milliseconds |
| lastDeliveryAt | string | No | ISO 8601 timestamp of last successful delivery |
| lastFailureAt | string | No | ISO 8601 timestamp of last failed delivery |
| suspendedAt | string | No | ISO 8601 timestamp when webhook was suspended |
| suspensionReason | string | No | Reason for suspension: `repeated_failures`, `policy_violation`, `rate_limit_exceeded` |
| failureCount | integer | No | Consecutive failure count |
| lastFailureError | string | No | Last failure error message |
| retryAfter | string | No | ISO 8601 timestamp when webhook can be retried |
| disabledAt | string | No | ISO 8601 timestamp when webhook was disabled |
| disabledReason | string | No | Reason for disabling: `user_disabled`, `security_policy`, `endpoint_invalid` |
| createdAt | string | Yes | ISO 8601 timestamp of webhook creation |
| updatedAt | string | Yes | ISO 8601 timestamp of last webhook update |

---

## Webhook Creation Scenarios

### Successful Creation (All Events)
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook_new123",
      "url": "https://api.example.com/webhooks/cv-enhancer",
      "events": [
        "resume.created",
        "resume.updated",
        "job.started",
        "job.completed",
        "job.failed",
        "version.created",
        "user.subscription_changed"
      ],
      "status": "active",
      "secret": "whsec_auto_generated_secret_key_for_signature_validation",
      "createdAt": "2024-01-15T15:00:00.000Z"
    },
    "testDelivery": {
      "id": "delivery_test456",
      "status": "delivered",
      "responseCode": 200,
      "sentAt": "2024-01-15T15:00:01.000Z",
      "deliveredAt": "2024-01-15T15:00:01.150Z"
    }
  }
}
```

### Creation Errors

#### Invalid URL
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Webhook URL must be HTTPS and publicly accessible",
    "details": {
      "providedUrl": "http://insecure-endpoint.com/webhook",
      "requiredScheme": "https",
      "accessibilityCheck": "failed",
      "error": "HTTP URLs not allowed for security"
    }
  }
}
```

#### URL Not Accessible
```json
{
  "success": false,
  "error": {
    "code": "URL_NOT_ACCESSIBLE",
    "message": "Webhook URL is not accessible or returned invalid response",
    "details": {
      "url": "https://nonexistent.example.com/webhook",
      "accessibilityCheck": "failed",
      "httpStatus": 404,
      "responseTimeMs": 5000,
      "timeoutMs": 10000
    }
  }
}
```

#### Invalid Events
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EVENTS",
    "message": "One or more event types are not supported",
    "details": {
      "providedEvents": ["resume.created", "invalid.event", "job.unknown"],
      "invalidEvents": ["invalid.event", "job.unknown"],
      "supportedEvents": [
        "resume.created", "resume.updated", "resume.deleted",
        "job.started", "job.completed", "job.failed", "job.cancelled",
        "version.created", "version.updated", "version.deleted",
        "user.created", "user.updated", "user.subscription_changed"
      ]
    }
  }
}
```

#### Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "WEBHOOK_LIMIT_EXCEEDED",
    "message": "Maximum number of webhooks exceeded for this account",
    "details": {
      "currentWebhooks": 10,
      "maxWebhooks": 10,
      "plan": "premium",
      "upgradeRequired": true
    }
  }
}
```

### Webhook Creation Request

```json
{
  "url": "https://api.example.com/webhooks/cv-enhancer",
  "events": [
    "resume.created",
    "job.completed",
    "job.failed"
  ],
  "secret": "optional_custom_secret_key",
  "description": "Production webhook for order processing"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | HTTPS webhook endpoint URL (must be publicly accessible) |
| events | array | Yes | Array of valid event types to subscribe to |
| secret | string | No | Custom secret for signature validation (auto-generated if not provided) |
| description | string | No | Human-readable description of webhook purpose |

---

## Webhook Update Request

```json
{
  "url": "https://example.com/webhook-updated",
  "events": ["resume.created", "generation.completed"],
  "secret": "new_secret_key"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | No | Webhook URL (must be HTTPS) |
| events | array | No | Array of event types to subscribe to |
| secret | string | No | Secret for webhook signature validation |

---

## Webhook Statistics

Comprehensive webhook and delivery statistics with performance metrics.

```json
{
  "summary": {
    "totalWebhooks": 25,
    "activeWebhooks": 20,
    "suspendedWebhooks": 3,
    "disabledWebhooks": 2,
    "totalDeliveries": 5000,
    "successfulDeliveries": 4850,
    "failedDeliveries": 150,
    "successRate": 0.97,
    "averageResponseTimeMs": 245
  },
  "byStatus": {
    "active": {
      "count": 20,
      "deliveries": 4800,
      "successRate": 0.975,
      "averageResponseTimeMs": 230
    },
    "suspended": {
      "count": 3,
      "deliveries": 150,
      "successRate": 0.0,
      "lastDeliveryAt": "2024-01-14T10:00:00.000Z"
    },
    "disabled": {
      "count": 2,
      "deliveries": 50,
      "successRate": 0.0,
      "disabledAt": "2024-01-10T00:00:00.000Z"
    }
  },
  "byEventType": {
    "resume.created": {
      "deliveries": 1200,
      "successRate": 0.98,
      "averageResponseTimeMs": 220
    },
    "job.completed": {
      "deliveries": 1800,
      "successRate": 0.96,
      "averageResponseTimeMs": 280
    },
    "job.failed": {
      "deliveries": 150,
      "successRate": 0.94,
      "averageResponseTimeMs": 310
    }
  },
  "performance": {
    "p95ResponseTimeMs": 450,
    "p99ResponseTimeMs": 800,
    "deliveriesPerMinute": 12.5,
    "errorRate": 0.03,
    "retryRate": 0.015
  },
  "recentActivity": {
    "lastHour": {
      "deliveries": 45,
      "successRate": 0.98,
      "averageResponseTimeMs": 235
    },
    "lastDay": {
      "deliveries": 1080,
      "successRate": 0.97,
      "averageResponseTimeMs": 245
    },
    "lastWeek": {
      "deliveries": 7560,
      "successRate": 0.96,
      "averageResponseTimeMs": 250
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| summary | object | Yes | Overall webhook statistics |
| summary.totalWebhooks | integer | Yes | Total number of webhooks configured |
| summary.activeWebhooks | integer | Yes | Number of currently active webhooks |
| summary.suspendedWebhooks | integer | Yes | Number of suspended webhooks |
| summary.disabledWebhooks | integer | Yes | Number of disabled webhooks |
| summary.totalDeliveries | integer | Yes | Total delivery attempts across all webhooks |
| summary.successfulDeliveries | integer | Yes | Successfully delivered webhooks |
| summary.failedDeliveries | integer | Yes | Failed delivery attempts |
| summary.successRate | number | Yes | Overall success rate (0.0-1.0) |
| summary.averageResponseTimeMs | integer | No | Average response time in milliseconds |
| byStatus | object | Yes | Statistics grouped by webhook status |
| byEventType | object | Yes | Statistics grouped by event type |
| performance | object | Yes | Performance metrics and percentiles |
| performance.p95ResponseTimeMs | integer | Yes | 95th percentile response time |
| performance.p99ResponseTimeMs | integer | Yes | 99th percentile response time |
| performance.deliveriesPerMinute | number | Yes | Average deliveries per minute |
| performance.errorRate | number | Yes | Error rate across all deliveries |
| performance.retryRate | number | Yes | Rate of delivery retries |
| recentActivity | object | Yes | Recent activity statistics |
| recentActivity.lastHour | object | Yes | Statistics for last hour |
| recentActivity.lastDay | object | Yes | Statistics for last 24 hours |
| recentActivity.lastWeek | object | Yes | Statistics for last 7 days |

---

## Webhook Delivery

Complete delivery attempt information with failure details and retry information.

### Delivery Status Values

- **`pending`**: Delivery queued but not yet sent
- **`sending`**: Delivery in progress
- **`delivered`**: Successfully delivered (2xx response)
- **`failed`**: Delivery failed (non-2xx response or error)
- **`timeout`**: Delivery timed out
- **`retried`**: Delivery failed and will be retried
- **`abandoned`**: Delivery abandoned after max retries

### Examples by Status

#### Successful Delivery
```json
{
  "id": "delivery_success123",
  "webhookId": "webhook_active123",
  "event": "resume.created",
  "status": "delivered",
  "attemptNumber": 1,
  "responseCode": 200,
  "responseBody": "{\"received\": true}",
  "responseHeaders": {
    "content-type": "application/json",
    "x-request-id": "req_abc123"
  },
  "responseTimeMs": 245,
  "sentAt": "2024-01-15T14:30:00.000Z",
  "deliveredAt": "2024-01-15T14:30:00.245Z",
  "signatureVerified": true,
  "payload": {
    "event": "resume.created",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "webhookId": "webhook_active123",
    "data": {
      "resumeId": "resume_new123",
      "resumeTitle": "Software Engineer Resume",
      "userId": "user_active123"
    }
  }
}
```

#### Failed Delivery (HTTP Error)
```json
{
  "id": "delivery_failed456",
  "webhookId": "webhook_active123",
  "event": "job.completed",
  "status": "failed",
  "attemptNumber": 1,
  "error": {
    "type": "http_error",
    "code": "HTTP_500",
    "message": "Internal server error",
    "details": "Webhook endpoint returned 500 status"
  },
  "responseCode": 500,
  "responseBody": "{\"error\": \"Internal server error\"}",
  "responseHeaders": {
    "content-type": "application/json",
    "server": "nginx/1.18.0"
  },
  "responseTimeMs": 1250,
  "sentAt": "2024-01-15T14:35:00.000Z",
  "failedAt": "2024-01-15T14:35:01.250Z",
  "willRetry": true,
  "nextRetryAt": "2024-01-15T14:35:31.250Z",
  "payload": {
    "event": "job.completed",
    "timestamp": "2024-01-15T14:35:00.000Z",
    "webhookId": "webhook_active123",
    "data": {
      "jobId": "job_parsing_complete789",
      "jobType": "parsing",
      "resumeId": "resume_complete789",
      "status": "completed",
      "result": {
        "parsed": true,
        "confidence": 0.95
      }
    }
  }
}
```

#### Timeout Failure
```json
{
  "id": "delivery_timeout789",
  "webhookId": "webhook_active123",
  "event": "version.created",
  "status": "timeout",
  "attemptNumber": 3,
  "error": {
    "type": "timeout",
    "code": "TIMEOUT",
    "message": "Request timed out after 30 seconds",
    "details": "No response received within timeout window"
  },
  "responseCode": null,
  "responseBody": null,
  "responseTimeMs": 30000,
  "sentAt": "2024-01-15T14:40:00.000Z",
  "failedAt": "2024-01-15T14:40:30.000Z",
  "willRetry": true,
  "nextRetryAt": "2024-01-15T14:42:00.000Z",
  "retryHistory": [
    {
      "attempt": 1,
      "sentAt": "2024-01-15T14:36:00.000Z",
      "failedAt": "2024-01-15T14:36:30.000Z",
      "error": "timeout"
    },
    {
      "attempt": 2,
      "sentAt": "2024-01-15T14:38:00.000Z",
      "failedAt": "2024-01-15T14:38:30.000Z",
      "error": "timeout"
    }
  ],
  "payload": {
    "event": "version.created",
    "timestamp": "2024-01-15T14:40:00.000Z",
    "webhookId": "webhook_active123",
    "data": {
      "versionId": "version_new001",
      "resumeId": "resume_active123",
      "versionNumber": 2
    }
  }
}
```

#### Network Error
```json
{
  "id": "delivery_network012",
  "webhookId": "webhook_active123",
  "event": "user.updated",
  "status": "failed",
  "attemptNumber": 2,
  "error": {
    "type": "network_error",
    "code": "CONNECTION_REFUSED",
    "message": "Connection refused by server",
    "details": "TCP connection failed: ECONNREFUSED"
  },
  "responseCode": null,
  "responseBody": null,
  "responseTimeMs": null,
  "sentAt": "2024-01-15T14:45:00.000Z",
  "failedAt": "2024-01-15T14:45:00.150Z",
  "willRetry": true,
  "nextRetryAt": "2024-01-15T14:45:30.150Z",
  "payload": {
    "event": "user.updated",
    "timestamp": "2024-01-15T14:45:00.000Z",
    "webhookId": "webhook_active123",
    "data": {
      "userId": "user_active123",
      "changes": ["name", "preferences"]
    }
  }
}
```

#### Abandoned Delivery (Max Retries Exceeded)
```json
{
  "id": "delivery_abandoned345",
  "webhookId": "webhook_active123",
  "event": "job.failed",
  "status": "abandoned",
  "attemptNumber": 6,
  "error": {
    "type": "max_retries_exceeded",
    "code": "ABANDONED",
    "message": "Delivery abandoned after 5 failed attempts",
    "details": "All retry attempts exhausted"
  },
  "sentAt": "2024-01-15T15:00:00.000Z",
  "abandonedAt": "2024-01-15T15:05:00.000Z",
  "retryHistory": [
    {"attempt": 1, "error": "timeout"},
    {"attempt": 2, "error": "http_500"},
    {"attempt": 3, "error": "connection_refused"},
    {"attempt": 4, "error": "dns_failure"},
    {"attempt": 5, "error": "ssl_error"}
  ],
  "payload": {
    "event": "job.failed",
    "timestamp": "2024-01-15T15:00:00.000Z",
    "webhookId": "webhook_active123",
    "data": {
      "jobId": "job_failed999",
      "jobType": "enhancement",
      "resumeId": "resume_failed999",
      "error": "Content too short for enhancement"
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Globally unique delivery identifier (format: `delivery_{random}`) |
| webhookId | string | Yes | Associated webhook identifier |
| event | string | Yes | Event type that triggered delivery |
| status | string | Yes | Delivery status: `pending`, `sending`, `delivered`, `failed`, `timeout`, `retried`, `abandoned` |
| attemptNumber | integer | Yes | Attempt number (1 for first attempt, increments on retry) |
| error | object | No | Error details (for failed deliveries) |
| error.type | string | No | Error type: `http_error`, `timeout`, `network_error`, `max_retries_exceeded` |
| error.code | string | No | Specific error code |
| error.message | string | No | Human-readable error message |
| error.details | string | No | Technical error details |
| responseCode | integer | No | HTTP response code (null for network errors) |
| responseBody | string | No | Response body from webhook endpoint |
| responseHeaders | object | No | HTTP response headers |
| responseTimeMs | integer | No | Response time in milliseconds |
| sentAt | string | Yes | ISO 8601 timestamp when delivery was initiated |
| deliveredAt | string | No | ISO 8601 timestamp when delivery was confirmed successful |
| failedAt | string | No | ISO 8601 timestamp when delivery failed |
| abandonedAt | string | No | ISO 8601 timestamp when delivery was abandoned |
| signatureVerified | boolean | No | Whether webhook signature was successfully verified |
| willRetry | boolean | No | Whether delivery will be retried |
| nextRetryAt | string | No | ISO 8601 timestamp of next retry attempt |
| retryHistory | array | No | History of previous retry attempts |
| payload | object | Yes | Complete webhook payload that was sent |

---

## Webhook Delivery List Item

Simplified delivery object for list responses.

```json
{
  "id": "delivery_123",
  "event": "resume.created",
  "status": "delivered",
  "responseCode": 200,
  "sentAt": "2024-01-01T00:00:00.000Z",
  "deliveredAt": "2024-01-01T00:00:01.000Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Delivery ID |
| event | string | Event type |
| status | string | Delivery status |
| responseCode | integer | HTTP response code |
| sentAt | string | Sent timestamp |
| deliveredAt | string | Delivered timestamp |

---

## Webhook Payload

Standard webhook payload structure.

```json
{
  "event": "parsing.completed",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "jobId": "job_parse_resume_def456uvw_1640995200",
    "resumeId": "resume_def456uvw",
    "status": "completed"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| event | string | Event type (see Supported Events) |
| timestamp | string | ISO 8601 timestamp of event |
| data | object | Event-specific data |

---

## Supported Events

| Event | Description |
|-------|-------------|
| `resume.created` | Triggered when a resume is created |
| `resume.updated` | Triggered when a resume is updated |
| `resume.deleted` | Triggered when a resume is deleted |
| `parsing.completed` | Triggered when CV parsing completes |
| `parsing.failed` | Triggered when CV parsing fails |
| `generation.completed` | Triggered when CV generation completes |
| `generation.failed` | Triggered when CV generation fails |
| `ats.analysis.completed` | Triggered when ATS analysis completes |
| `ats.analysis.failed` | Triggered when ATS analysis fails |
| `enhancement.completed` | Triggered when enhancement completes |
| `enhancement.failed` | Triggered when enhancement fails |

---

## Webhook Trends

```json
{
  "trends": {
    "period": "week",
    "data": [
      {
        "date": "2024-01-01",
        "delivered": 50,
        "failed": 2
      }
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| period | string | Time period: `day`, `week`, `month` |
| data | array | Trend data points |
| data[].date | string | Date (YYYY-MM-DD) |
| data[].delivered | integer | Number of successful deliveries |
| data[].failed | integer | Number of failed deliveries |

---

## Webhook Cleanup Request

```json
{
  "olderThan": "2024-01-01T00:00:00.000Z",
  "status": "delivered"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| olderThan | string | No | ISO date string - delete deliveries older than this date |
| status | string | No | Filter by status: `delivered`, `failed` |

---

## Webhook Test Response

```json
{
  "testDelivery": {
    "id": "delivery_123",
    "status": "delivered",
    "sentAt": "2024-01-01T00:00:00.000Z",
    "responseCode": 200
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| testDelivery | object | Test delivery information |
| testDelivery.id | string | Test delivery ID |
| testDelivery.status | string | Delivery status |
| testDelivery.sentAt | string | Sent timestamp |
| testDelivery.responseCode | integer | HTTP response code |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

