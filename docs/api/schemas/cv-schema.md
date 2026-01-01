# CV Schema

## CV Object

Main CV document structure representing a resume in the system.

### CV Status (`status`)
- **`draft`**: Resume is in progress.
- **`active`**: Resume is published.
- **`archived`**: Resume is hidden/archived.
- **`deleted`**: Resume is marked for deletion.

### Parsing Status (`parsingStatus`)
- **`pending`**: Job created, not started.
- **`processing`**: AI extraction in progress.
- **`completed`**: Successfully parsed.
- **`failed`**: Error during extraction.

```json
{
  "id": "658f0a...",
  "userId": "658f09...",
  "title": "Senior Software Engineer CV",
  "description": "Professional experience at Tech Corp",
  "status": "draft",
  "source": "manual",
  "tags": ["software", "career"],
  "content": {},
  "metadata": {
    "originalFilename": "resume.pdf",
    "fileSize": 256000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-01T12:00:00Z"
  },
  "template": "modern",
  "settings": {
    "theme": "light",
    "fontSize": "medium",
    "pageFormat": "A4"
  },
  "parsingStatus": "completed",
  "isParsed": true,
  "parsedAt": "2024-01-01T12:01:30Z",
  "parsingProgress": 100,
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:05:00Z"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Internal MongoDB ObjectID |
| title | string | Yes | CV title (max 100 chars) |
| description| string | No | Optional description |
| status | string | Yes | `draft`, `active`, `archived`, `deleted` |
| source | string | Yes | `manual`, `upload`, `duplicate` |
| tags | array | No | List of strings |
| content | object | No | Raw CV content (JSON editor) |
| metadata | object | No | File and statistics metadata |
| template | string | Yes | Template name (e.g., `modern`, `professional`) |
| settings | object | Yes | Layout and theme settings |
| parsingStatus| string | Yes | Current state of AI processing |
| isParsed | boolean | Yes | Whether parsing succeeded |
| parsingProgress| number | Yes | Progress percentage (0-100) |
| createdAt | string | Yes | Created timestamp |
| updatedAt | string | Yes | Last updated timestamp |

---
**Last Updated:** 2026-01-01
