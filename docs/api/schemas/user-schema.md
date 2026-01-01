# User Schema

## User Object

Complete user account information.

### User Status
- **`active`**: Full access.
- **`inactive`**: Deactivated.
- **`suspended`**: Banned/Suspended.
- **`pending_verification`**: Email not yet verified.

### Subscription Plan
- **`free`**: Basic features.
- **`basic`**: Standard features.
- **`pro`**: Full features.
- **`enterprise`**: Massive scale.

```json
{
  "id": "658f09...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John D.",
  "avatar": {
    "url": "https://...",
    "uploadedAt": "2024-01-01T10:00:00Z"
  },
  "status": "active",
  "role": "user",
  "emailVerified": true,
  "subscription": {
    "status": "free",
    "plan": "free",
    "cancelAtPeriodEnd": false
  },
  "usageStats": {
    "totalGenerations": 5,
    "totalEnhancements": 12,
    "storageUsed": 2.5
  },
  "preferences": {
    "theme": "auto",
    "language": "en"
  },
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/..."
  },
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | MongoDB ID |
| email | string | Normalized email address |
| firstName | string | User's first name |
| lastName | string | User's last name |
| displayName| string | Custom display name |
| avatar | object | Avatar URL and metadata |
| status | string | `active`, `pending_verification`, etc. |
| role | string | `user`, `premium`, `admin` |
| emailVerified| boolean| True if email is verified |
| subscription | object | Current plan and billing status |
| usageStats | object | Aggregated usage metrics |
| preferences | object | UI and localization settings |
| socialLinks | object | Optional social profile links |
| createdAt | string | Account creation date |

---
**Last Updated:** 2026-01-01
