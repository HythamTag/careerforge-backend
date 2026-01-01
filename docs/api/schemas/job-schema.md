# Job Schema

## Job Object

Represents an asynchronous background task (parsing, analysis, etc.).

### Job Status
- **`pending`**: In queue.
- **`processing`**: Active.
- **`completed`**: Finished successfully.
- **`failed`**: Error encountered.
- **`cancelled`**: Stopped by user.

```json
{
  "jobId": "658f1a...",
  "backgroundJobId": "bull_123",
  "userId": "658f09...",
  "cvId": "658f0a...",
  "fileName": "resume.pdf",
  "fileSize": 256000,
  "fileType": "pdf",
  "status": "completed",
  "progress": 100,
  "priority": "normal",
  "result": {
    "parsedContent": { ... },
    "confidence": 0.95,
    "processingTime": 12000
  },
  "error": null,
  "metadata": {
    "aiModel": "llama3",
    "retryCount": 0
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:01:30Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| jobId | string | Public identifier (UUID or MongoID) |
| backgroundJobId| string | internal Bull queue ID |
| userId | string | ID of the owner |
| cvId | string | ID of the associated CV |
| fileName | string | Original filename |
| fileSize | number | Size in bytes |
| fileType | string | `pdf`, `docx`, `doc` |
| status | string | `pending`, `processing`, `completed`, `failed` |
| progress | number | 0 to 100 |
| priority | string | `low`, `normal`, `high` |
| result | object | Type-specific job results |
| error | object | Error code and message |
| metadata | object | retry counts and engine versions |

---
**Last Updated:** 2026-01-01
