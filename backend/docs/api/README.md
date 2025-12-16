# Backend API Documentation

## Overview

This document describes the REST API endpoints for the CareerForge backend.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": { ... } | [...],
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [...]
  }
}
```

## Error Codes

- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID_TOKEN` - Invalid or expired token
- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limiting

API endpoints are rate limited to 100 requests per 15 minutes per IP.
