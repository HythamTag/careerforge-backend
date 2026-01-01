# Common Schemas

## Success Response

All successful API responses follow this structure.

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    // Optional metadata
  },
  "_links": {
    // Optional HATEOAS links
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| success | boolean | Yes | Always `true` for successful responses |
| data | object | Yes | Response data (structure varies by endpoint) |
| meta | object | No | Optional metadata |
| _links | object | No | Optional HATEOAS links |

---

## Error Response

All error responses follow this structure.

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional error details
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| success | boolean | Yes | Always `false` for error responses |
| error | object | Yes | Error object |
| error.code | string | Yes | Error code (see Error Codes) |
| error.message | string | Yes | Human-readable error message |
| error.details | object | No | Additional error details |

---

## Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Email is required", "Email format is invalid"],
        "password": ["Password must be at least 8 characters", "Password must contain at least one uppercase letter"]
      }
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| error.details.fields | object | No | Field validation errors |
| error.details.fields[fieldName] | array | No | Array of error messages for the field |

---

## Resource Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "RESUME_NOT_FOUND",
    "message": "Resume not found",
    "details": {
      "resumeId": "resume_def456uvw"
    }
  }
}
```

---

## Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired",
    "details": {
      "expiredAt": "2024-01-01T00:15:00.000Z",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

## Pagination Object

Pagination metadata included in paginated responses.

```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "pages": 5
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| page | integer | Current page number (1-indexed) |
| limit | integer | Number of items per page |
| total | integer | Total number of items |
| pages | integer | Total number of pages |

---

## Paginated Response

Complete paginated response structure.

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  },
  "_links": {
    "self": "/v1/resumes?page=1&limit=20",
    "first": "/v1/resumes?page=1&limit=20",
    "prev": null,
    "next": "/v1/resumes?page=2&limit=20",
    "last": "/v1/resumes?page=5&limit=20"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| data.items | array | Array of items for current page |
| data.pagination | object | Pagination metadata (see Pagination Object) |
| _links | object | Navigation links |
| _links.self | string | Link to current page |
| _links.first | string | Link to first page |
| _links.prev | string | Link to previous page (null if on first page) |
| _links.next | string | Link to next page (null if on last page) |
| _links.last | string | Link to last page |

---

## HATEOAS Links

Hypermedia links for API navigation.

```json
{
  "self": "/v1/resumes/resume_def456uvw",
  "versions": "/v1/resumes/resume_def456uvw/versions",
  "file": "/v1/resumes/resume_def456uvw/file",
  "parse": {
    "href": "/v1/resumes/resume_def456uvw/parse",
    "method": "POST"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| [linkName] | string or object | Link URL (string) or link object with href and method |
| [linkName].href | string | Link URL (when link is object) |
| [linkName].method | string | HTTP method (when link is object) |

---

## Job Status Response

Standard job status response structure.

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_parse_resume_def456uvw_1640995200",
      "jobId": "job_parse_resume_def456uvw_1640995200",
      "type": "parsing",
      "status": "completed",
      "progress": 100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "startedAt": "2024-01-01T00:00:05.000Z",
      "completedAt": "2024-01-01T00:01:30.000Z",
      "processingTimeMs": 85000
    }
  },
  "_links": {
    "self": "/v1/jobs/job_parse_resume_def456uvw_1640995200",
    "result": "/v1/jobs/job_parse_resume_def456uvw_1640995200/result",
    "cancel": { "href": "/v1/jobs/job_parse_resume_def456uvw_1640995200", "method": "DELETE" }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| data.job | object | Job object (see Job Schema) |
| _links.result | string | Link to job result (null if not available) |
| _links.cancel | string | Link to cancel job (null if not cancellable) |

---

## Rate Limit Response

Response when rate limit is exceeded (429 Too Many Requests).

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2024-01-01T00:01:00.000Z",
      "retryAfter": 60
    }
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| error.details.limit | integer | Maximum requests allowed |
| error.details.remaining | integer | Remaining requests in current window |
| error.details.resetAt | string | ISO 8601 timestamp when limit resets |
| error.details.retryAfter | integer | Seconds to wait before retrying |

---

## Rate Limit Headers

Rate limit information in response headers.

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit resets |
| `Retry-After` | Seconds to wait before retrying (when rate limited) |

---

## File Upload Response

Response for file upload operations.

```json
{
  "success": true,
  "data": {
    "fileName": "resume.pdf",
    "fileSize": 245760,
    "mimeType": "application/pdf",
    "url": "https://example.com/files/resume.pdf"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| fileName | string | Uploaded filename |
| fileSize | integer | File size in bytes |
| mimeType | string | File MIME type |
| url | string | URL to access the uploaded file |

---

## File Download Headers

Response headers for file downloads.

| Header | Description |
|--------|-------------|
| `Content-Type` | MIME type of the file |
| `Content-Disposition` | `attachment; filename="filename.ext"` |
| `Content-Length` | File size in bytes |
| `ETag` | Entity tag for caching (if supported) |
| `Last-Modified` | Last modification timestamp |

---

## Statistics Object

Common statistics structure used across endpoints.

```json
{
  "total": 100,
  "successful": 95,
  "failed": 5,
  "averageProcessingTime": 45000,
  "lastProcessedAt": "2024-01-01T00:00:00.000Z"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|-------------|
| total | integer | Total count |
| successful | integer | Number of successful operations |
| failed | integer | Number of failed operations |
| averageProcessingTime | integer | Average processing time in milliseconds |
| lastProcessedAt | string | ISO 8601 timestamp of last processing |

---

## Comprehensive Error Codes

### Authentication & Authorization Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email/password combination is incorrect | Check credentials and try again |
| `ACCOUNT_NOT_VERIFIED` | 401 | Account exists but email not verified | Check email for verification link |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended due to policy violation | Contact support |
| `ACCOUNT_LOCKED` | 423 | Account temporarily locked after failed attempts | Wait or reset password |
| `TOKEN_EXPIRED` | 401 | Access token has expired | Refresh token or re-authenticate |
| `TOKEN_INVALID` | 401 | Access token is malformed or invalid | Re-authenticate |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions | Upgrade plan or contact admin |
| `SESSION_EXPIRED` | 401 | User session has expired | Re-authenticate |

### Resource Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist | Check ID and try again |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource with same identifier already exists | Use different identifier |
| `RESOURCE_LIMIT_EXCEEDED` | 429 | User has exceeded resource limits | Upgrade plan or delete resources |
| `RESOURCE_PROCESSING` | 409 | Resource is currently being processed | Wait and retry |
| `RESOURCE_LOCKED` | 423 | Resource is locked for editing | Wait for unlock or contact support |

### File Upload Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `FILE_TOO_LARGE` | 413 | File exceeds maximum size limit | Reduce file size or compress |
| `UNSUPPORTED_FILE_FORMAT` | 415 | File format not supported | Convert to supported format |
| `FILE_CORRUPTED` | 422 | File appears corrupted | Use different file or repair |
| `VIRUS_DETECTED` | 422 | File contains malware | Scan file and try again |
| `FILE_PROCESSING_FAILED` | 422 | File processing failed | Try different file or contact support |

### Validation Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data failed validation | Check field requirements and formats |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing | Provide all required fields |
| `INVALID_FIELD_FORMAT` | 400 | Field format is invalid | Check field format requirements |
| `INVALID_FIELD_VALUE` | 400 | Field value is not acceptable | Use valid values from documentation |
| `FIELD_TOO_LONG` | 400 | Field exceeds maximum length | Shorten field content |
| `FIELD_TOO_SHORT` | 400 | Field below minimum length | Expand field content |

### Rate Limiting Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window | Wait and retry with backoff |
| `QUOTA_EXCEEDED` | 429 | Monthly/daily quota exceeded | Upgrade plan or wait for reset |
| `CONCURRENT_LIMIT_EXCEEDED` | 429 | Too many concurrent requests | Reduce concurrency or upgrade |

### Job Processing Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `JOB_QUEUE_FULL` | 503 | Job queue is at capacity | Wait and retry later |
| `JOB_TIMEOUT` | 504 | Job processing timed out | Try again or contact support |
| `JOB_FAILED` | 422 | Job failed during processing | Check job logs and retry |
| `JOB_CANCELLED` | 409 | Job was cancelled | Check cancellation reason |

### Subscription & Billing Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `PAYMENT_REQUIRED` | 402 | Payment required for operation | Update payment method |
| `PAYMENT_FAILED` | 402 | Payment processing failed | Check payment details |
| `SUBSCRIPTION_EXPIRED` | 402 | Subscription has expired | Renew subscription |
| `SUBSCRIPTION_CANCELLED` | 402 | Subscription was cancelled | Reactivate or create new |
| `PLAN_LIMIT_EXCEEDED` | 402 | Operation exceeds plan limits | Upgrade plan |

### System Errors

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected internal error | Try again later or contact support |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Try again later |
| `DATABASE_ERROR` | 500 | Database operation failed | Try again later |
| `CACHE_ERROR` | 500 | Caching system error | Try again later |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service communication failed | Try again later |

## Response Types by HTTP Status

### 2xx Success Responses

#### 200 OK - Standard Success
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T14:30:00.000Z",
    "processingTimeMs": 245
  }
}
```

#### 201 Created - Resource Created
```json
{
  "success": true,
  "data": {
    "id": "resource_123",
    "createdAt": "2024-01-15T14:30:00.000Z",
    // Additional resource data
  },
  "meta": {
    "requestId": "req_abc123",
    "location": "/v1/resources/resource_123"
  }
}
```

#### 202 Accepted - Async Processing Started
```json
{
  "success": true,
  "data": {
    "jobId": "job_async_456",
    "status": "pending",
    "estimatedDuration": "30-120 seconds"
  },
  "meta": {
    "requestId": "req_abc123",
    "statusUrl": "/v1/jobs/job_async_456"
  }
}
```

#### 204 No Content - Success, No Response Body
```
HTTP/1.1 204 No Content
X-Request-ID: req_abc123
X-Processing-Time: 150ms
```

### 4xx Client Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Invalid email format"],
        "password": ["Must be at least 8 characters"]
      }
    }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

#### 401 Unauthorized - Authentication Required
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication is required for this endpoint",
    "details": {
      "availableMethods": ["bearer_token", "api_key"]
    }
  }
}
```

#### 403 Forbidden - Access Denied
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to perform this action",
    "details": {
      "requiredRole": "premium",
      "currentRole": "free"
    }
  }
}
```

#### 404 Not Found - Resource Not Found
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resourceType": "resume",
      "resourceId": "resume_notfound123"
    }
  }
}
```

#### 409 Conflict - Resource Conflict
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Resource already exists or is in conflicting state",
    "details": {
      "conflictType": "duplicate_email",
      "existingResource": "user_existing123"
    }
  }
}
```

#### 422 Unprocessable Entity - Business Logic Error
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Operation violates business rules",
    "details": {
      "rule": "resume_limit_exceeded",
      "currentCount": 5,
      "limit": 5
    }
  }
}
```

#### 429 Too Many Requests - Rate Limited
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "remaining": 0,
      "resetIn": 45
    }
  },
  "meta": {
    "retryAfter": 45
  }
}
```

### 5xx Server Error Responses

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "errorId": "err_abc123",
      "timestamp": "2024-01-15T14:30:00.000Z"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "supportContact": "support@cv-enhancer.com"
  }
}
```

#### 503 Service Unavailable
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is temporarily unavailable",
    "details": {
      "estimatedDowntime": "5-10 minutes",
      "maintenanceWindow": false
    }
  },
  "meta": {
    "retryAfter": 300
  }
}
```

## Pagination Response Format

### Paginated List Response
```json
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false,
      "nextPage": 2,
      "previousPage": null
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "processingTimeMs": 125
  }
}
```

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `pageSize` | integer | 20 | Items per page (max 100) |
| `sortBy` | string | createdAt | Field to sort by |
| `sortOrder` | string | desc | Sort order: `asc`, `desc` |
| `filter[field]` | varies | - | Filter by field value |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

