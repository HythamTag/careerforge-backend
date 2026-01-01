# Version Schema

## Version Object

Complete version information with content, metadata, and change tracking.

### Version Creation Methods

- **`manual`**: User-initiated save
- **`auto_save`**: Automatic save during editing
- **`generated`**: Created by AI generation
- **`optimized`**: Created by AI optimization
- **`imported`**: Created by importing external data

### Version Status Values

- **`draft`**: Version being edited, not yet published
- **`active`**: Currently active version of the resume
- **`archived`**: Version saved for reference but not active
- **`deleted`**: Version marked for deletion (soft delete)

### Examples by Creation Method

#### Auto-Save Version
```json
{
  "id": "version_auto_123",
  "resumeId": "resume_active123",
  "version": 5,
  "name": "Auto-saved at 2:30 PM",
  "description": "Automatic save during editing session",
  "creationMethod": "auto_save",
  "status": "draft",
  "isActive": false,
  "content": {
    "personal": { "name": "John Doe", "email": "john@example.com" },
    "experience": [],
    "education": []
  },
  "changes": {
    "added": ["experience[0]"],
    "modified": ["personal.email"],
    "removed": [],
    "summary": "Added first job experience, updated email"
  },
  "metadata": {
    "editorSession": "session_abc123",
    "autoSaveInterval": 300,
    "wordCount": 245,
    "characterCount": 1456
  },
  "createdAt": "2024-01-15T14:30:00.000Z",
  "createdBy": "user_active123"
}
```

#### Enhancement Version
```json
{
  "id": "version_enhanced_456",
  "resumeId": "resume_active123",
  "version": 6,
  "name": "AI Enhanced - Professional Tone",
  "description": "Enhanced with professional language and quantified achievements",
  "creationMethod": "enhancement",
  "status": "active",
  "isActive": true,
  "content": {
    "personal": { "name": "John Doe" },
    "experience": [{
      "title": "Software Engineer",
      "company": "Tech Corp",
      "achievements": ["Developed and deployed 3+ web applications serving 10K+ users"]
    }]
  },
  "changes": {
    "added": [],
    "modified": ["experience[0].achievements"],
    "removed": [],
    "summary": "Enhanced experience descriptions with quantifiable metrics"
  },
  "enhancementMetadata": {
    "enhancementType": "content",
    "aiModel": "gpt-4-turbo",
    "confidence": 0.89,
    "improvements": [
      "Added quantifiable achievements",
      "Improved professional tone",
      "Enhanced keyword density"
    ]
  },
  "createdAt": "2024-01-15T15:00:00.000Z",
  "createdBy": "user_active123"
}
```

#### Revert Version
```json
{
  "id": "version_revert_789",
  "resumeId": "resume_active123",
  "version": 7,
  "name": "Reverted to Version 3",
  "description": "Reverted from enhanced version back to simpler version",
  "creationMethod": "revert",
  "status": "active",
  "isActive": true,
  "content": {
    "personal": { "name": "John Doe" },
    "experience": [{
      "title": "Software Engineer",
      "company": "Tech Corp",
      "achievements": ["Developed web applications"]
    }]
  },
  "changes": {
    "added": [],
    "modified": ["experience[0].achievements"],
    "removed": [],
    "summary": "Reverted achievements to original wording"
  },
  "revertMetadata": {
    "revertedFrom": "version_enhanced_456",
    "revertedTo": "version_manual_012",
    "reason": "user_preference"
  },
  "createdAt": "2024-01-15T15:30:00.000Z",
  "createdBy": "user_active123"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Globally unique version identifier (format: `version_{random}`) |
| resumeId | string | Yes | Associated resume identifier |
| version | integer | Yes | Sequential version number (1, 2, 3, ...) |
| name | string | Yes | Human-readable version name |
| description | string | No | Version description/notes |
| creationMethod | string | Yes | How version was created: `auto_save`, `manual_save`, `enhancement`, `generation`, `import`, `revert`, `duplicate` |
| status | string | Yes | Version status: `active`, `draft`, `archived`, `deleted` |
| isActive | boolean | Yes | Whether this is the currently active version |
| content | object | Yes | Complete resume content structure |
| changes | object | No | Summary of changes from previous version |
| changes.added | array | No | New content sections/fields added |
| changes.modified | array | No | Existing content modified |
| changes.removed | array | No | Content sections/fields removed |
| changes.summary | string | No | Human-readable change summary |
| metadata | object | No | Additional version metadata |
| metadata.editorSession | string | No | Associated editing session ID |
| metadata.autoSaveInterval | integer | No | Auto-save interval in seconds |
| metadata.wordCount | integer | No | Content word count |
| metadata.characterCount | integer | No | Content character count |
| enhancementMetadata | object | No | AI enhancement details (for enhancement versions) |
| enhancementMetadata.enhancementType | string | No | Type of enhancement performed |
| enhancementMetadata.aiModel | string | No | AI model used |
| enhancementMetadata.confidence | number | No | AI confidence score (0-1) |
| enhancementMetadata.improvements | array | No | List of improvements made |
| revertMetadata | object | No | Revert operation details (for revert versions) |
| revertMetadata.revertedFrom | string | No | Version ID reverted from |
| revertMetadata.revertedTo | string | No | Version ID reverted to |
| revertMetadata.reason | string | No | Revert reason: `user_preference`, `error_correction`, `testing` |
| createdAt | string | Yes | ISO 8601 creation timestamp |
| createdBy | string | Yes | User ID who created this version |

---

## Version Operations

### Activation (Making a Version Active)
```json
{
  "operation": "activate",
  "versionId": "version_draft_123",
  "previousActiveVersion": "version_active_456",
  "changes": {
    "status": "draft → active",
    "isActive": "false → true"
  },
  "validation": {
    "contentValid": true,
    "noConflicts": true
  }
}
```

### Comparison (Diff Between Versions)
```json
{
  "operation": "compare",
  "version1": "version_old_123",
  "version2": "version_new_456",
  "differences": {
    "sections": {
      "added": ["certifications"],
      "removed": [],
      "modified": ["experience", "skills"]
    },
    "fields": {
      "experience[0].achievements": "Modified",
      "skills.technical": "Added 3 items",
      "personal.phone": "Changed"
    },
    "similarity": 0.78
  }
}
```

### Conflict Resolution (Concurrent Edits)
```json
{
  "operation": "resolve_conflict",
  "conflictingVersions": ["version_a_123", "version_b_456"],
  "resolution": "merge",
  "mergedContent": {
    "strategy": "user_preference",
    "conflicts": [
      {
        "field": "experience[0].description",
        "versionA": "Original description",
        "versionB": "Modified description",
        "chosen": "versionB"
      }
    ]
  },
  "resultVersion": "version_merged_789"
}
```

---

## Version Workflow Examples

### Complete Version Lifecycle
1. **Version 1**: Manual creation → `active`
2. **Version 2**: Auto-save during editing → `draft`
3. **Version 3**: Manual save with changes → `active` (Version 2 archived)
4. **Version 4**: AI enhancement → `active` (Version 3 archived)
5. **Version 5**: Revert to Version 3 → `active` (Version 4 archived)
6. **Version 6**: Final manual edits → `active`

### Branching Scenario
- **Main Branch**: Versions 1, 3, 5, 7 (active versions)
- **Draft Branch**: Versions 2, 4, 6 (unpublished drafts)
- **Archive Branch**: Versions 8, 9, 10 (archived experiments)

---

## Version List Item

Simplified version object for list responses.

```json
{
  "id": "version_abc123xyz",
  "resumeId": "resume_def456uvw",
  "version": 1,
  "name": "Initial Version",
  "description": "First version of the resume",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "createdBy": "user_abc123xyz"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Globally unique version ID |
| version | integer | Version number |
| name | string | Version name |
| description | string | Version description |
| isActive | boolean | Whether version is active |
| createdAt | string | Creation timestamp |
| createdBy | string | Globally unique creator user ID |

---

## Version Creation Request

```json
{
  "name": "Version 2.0",
  "description": "Updated with new experience",
  "content": {
    "personal": { "name": "John Doe" },
    "experience": []
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Version name |
| description | string | No | Version description |
| content | object | Yes | Resume content object (see Resume Content Schema) |

---

## Version Revert Request

```json
{
  "name": "Reverted to Version 1",
  "description": "Reverted from version 3"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Name for the new version (default: "Reverted to Version {version}") |
| description | string | No | Description for the new version |

---

## Version Comparison Result

```json
{
  "version1": {
    "id": "version_abc123xyz",
    "name": "Version 1"
  },
  "version2": {
    "id": "version_def456uvw",
    "name": "Version 2"
  },
  "diff": {
    "personal": {
      "name": { "old": "John Doe", "new": "John Smith" }
    },
    "experience": {
      "added": 1,
      "removed": 0,
      "modified": 0
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| version1 | object | First version information |
| version1.id | string | Globally unique version ID |
| version1.name | string | Version name |
| version2 | object | Second version information |
| version2.id | string | Globally unique version ID |
| version2.name | string | Version name |
| diff | object | Difference object showing changes |
| diff.personal | object | Changes in personal information |
| diff.experience | object | Changes in experience section |
| diff.experience.added | integer | Number of items added |
| diff.experience.removed | integer | Number of items removed |
| diff.experience.modified | integer | Number of items modified |

---

## Resume Content Schema

Complete resume content structure.

```json
{
  "personal": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "location": "New York, NY",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe",
    "title": "Senior Software Engineer"
  },
  "summary": "Experienced software engineer with 5+ years...",
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "New York, NY",
      "startDate": "2020-01-01",
      "endDate": "2024-01-01",
      "current": false,
      "bullets": [
        "Developed scalable web applications",
        "Led team of 5 engineers"
      ]
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2016-09-01",
      "endDate": "2020-05-31",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React"],
    "soft": ["Leadership", "Communication"]
  },
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "date": "2023-01-01",
      "expiryDate": "2026-01-01"
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built a scalable e-commerce platform",
      "technologies": ["React", "Node.js", "MongoDB"],
      "url": "https://example.com/project"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| personal | object | Personal information |
| personal.name | string | Full name |
| personal.email | string | Email address |
| personal.phone | string | Phone number |
| personal.location | string | Location |
| personal.linkedin | string | LinkedIn profile URL |
| personal.github | string | GitHub profile URL |
| personal.title | string | Professional title |
| summary | string | Professional summary |
| experience | array | Work experience entries |
| experience[].title | string | Job title |
| experience[].company | string | Company name |
| experience[].location | string | Job location |
| experience[].startDate | string | Start date (YYYY-MM-DD) |
| experience[].endDate | string | End date (YYYY-MM-DD) or null for current |
| experience[].current | boolean | Whether this is current position |
| experience[].bullets | array | Array of achievement bullet points |
| education | array | Education entries |
| education[].institution | string | Institution name |
| education[].degree | string | Degree type |
| education[].field | string | Field of study |
| education[].startDate | string | Start date (YYYY-MM-DD) |
| education[].endDate | string | End date (YYYY-MM-DD) |
| education[].gpa | string | GPA (optional) |
| skills | object | Skills object |
| skills.technical | array | Technical skills |
| skills.soft | array | Soft skills |
| certifications | array | Certification entries |
| certifications[].name | string | Certification name |
| certifications[].issuer | string | Issuing organization |
| certifications[].date | string | Issue date (YYYY-MM-DD) |
| certifications[].expiryDate | string | Expiry date (YYYY-MM-DD) or null |
| projects | array | Project entries |
| projects[].name | string | Project name |
| projects[].description | string | Project description |
| projects[].technologies | array | Technologies used |
| projects[].url | string | Project URL (optional) |
| languages | array | Language entries |
| languages[].language | string | Language name |
| languages[].proficiency | string | Proficiency level |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

