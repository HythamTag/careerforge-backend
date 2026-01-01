# Enhancement Schema

## Enhancement Result

Complete enhancement result with improved content, quality metrics, and detailed change tracking.

### Enhancement Types

- **`optimize`**: Optimize existing content
- **`rewrite`**: Rewrite content for better quality
- **`expand`**: Expand content with more details
- **`shorten`**: Shorten content for conciseness
- **`keywords`**: Optimize keywords for ATS compatibility
- **`impact`**: Improve impact and achievements
- **`structure`**: Improve resume organization
- **`tailor`**: Customize content for specific jobs

### Enhancement Quality Metrics

- **Readability Score**: Content clarity and flow (0-100)
- **Impact Score**: Strength of achievements and descriptions (0-100)
- **Keyword Density**: Optimal keyword placement (0-100)
- **ATS Compatibility**: ATS parsing friendliness (0-100)
- **Uniqueness Score**: Originality vs generic content (0-100)

### Examples by Enhancement Type

#### Content Enhancement (Writing Quality)
```json
{
  "enhancementType": "content",
  "enhancementId": "enhance_content_123",
  "resumeId": "resume_active123",
  "originalVersion": "version_original_456",
  "enhancedVersion": "version_enhanced_789",
  "improvements": [
    {
      "category": "writing_quality",
      "description": "Improved sentence structure and professional tone",
      "impact": "high",
      "examples": [
        {
          "original": "I worked on web apps",
          "enhanced": "Developed and maintained scalable web applications using React and Node.js",
          "improvement": "Added technical details and quantified scope"
        }
      ]
    },
    {
      "category": "clarity",
      "description": "Enhanced summary section clarity",
      "impact": "medium",
      "examples": [
        {
          "original": "I am a developer",
          "enhanced": "Innovative software engineer with 5+ years of experience in full-stack development",
          "improvement": "Added specific experience and role clarity"
        }
      ]
    }
  ],
  "qualityMetrics": {
    "readabilityScore": 85,
    "impactScore": 78,
    "keywordDensity": 72,
    "atsCompatibility": 88,
    "uniquenessScore": 91,
    "overallImprovement": 23
  },
  "enhancedContent": {
    "personal": { "name": "John Doe" },
    "summary": "Results-driven software engineer with 5+ years of experience...",
    "experience": []
  },
  "changeSummary": {
    "sectionsModified": ["summary", "experience", "skills"],
    "wordsAdded": 45,
    "wordsRemoved": 12,
    "readabilityChange": "+15%",
    "keywordMatchesAdded": 8
  },
  "metadata": {
    "aiModel": "gpt-4-turbo",
    "processingTimeMs": 45000,
    "enhancementVersion": "2.1.0",
    "confidence": 0.89
  },
  "createdAt": "2024-01-15T15:00:00.000Z"
}
```

#### Keywords Enhancement (ATS Optimization)
```json
{
  "enhancementType": "keywords",
  "enhancementId": "enhance_keywords_456",
  "resumeId": "resume_active123",
  "jobTarget": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "keywords": ["react", "node.js", "typescript", "aws", "docker"]
  },
  "improvements": [
    {
      "category": "keyword_optimization",
      "description": "Added relevant technical keywords for target position",
      "impact": "high",
      "keywords": {
        "added": ["typescript", "aws", "docker", "kubernetes", "microservices"],
        "removed": ["basic", "simple"],
        "optimized": ["javascript → typescript"]
      }
    },
    {
      "category": "skill_alignment",
      "description": "Aligned skills section with job requirements",
      "impact": "high",
      "matchingScore": 85
    }
  ],
  "qualityMetrics": {
    "keywordDensity": 78,
    "atsCompatibility": 92,
    "jobMatchScore": 85,
    "keywordRelevance": 88
  },
  "keywordAnalysis": {
    "matchedKeywords": ["react", "node.js", "javascript"],
    "missingKeywords": ["typescript", "aws"],
    "suggestedAdditions": ["typescript", "aws", "docker"],
    "optimalDensity": 0.045
  }
}
```

#### Comprehensive Enhancement (All Types Combined)
```json
{
  "enhancementType": "comprehensive",
  "enhancementId": "enhance_comprehensive_789",
  "resumeId": "resume_active123",
  "enhancementTypes": ["content", "keywords", "structure", "quantify"],
  "improvements": [
    {
      "category": "content_quality",
      "description": "Comprehensive content improvement",
      "subImprovements": ["writing_quality", "professional_tone", "impact_statements"]
    },
    {
      "category": "ats_optimization",
      "description": "Complete ATS compatibility enhancement",
      "subImprovements": ["keyword_optimization", "formatting", "structure"]
    },
    {
      "category": "quantification",
      "description": "Added metrics and quantifiable achievements",
      "subImprovements": ["experience_metrics", "impact_measurement", "scale_indicators"]
    }
  ],
  "qualityMetrics": {
    "overallScore": 88,
    "contentQuality": 85,
    "atsCompatibility": 90,
    "keywordOptimization": 92,
    "structureImprovement": 78,
    "quantificationLevel": 82
  },
  "beforeAfterComparison": {
    "readability": {"before": 65, "after": 85, "improvement": "+31%"},
    "atsScore": {"before": 72, "after": 90, "improvement": "+25%"},
    "keywordDensity": {"before": 0.023, "after": 0.045, "improvement": "+96%"},
    "wordCount": {"before": 245, "after": 312, "improvement": "+27%"}
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| enhancementType | string | Yes | Enhancement type: `content`, `keywords`, `structure`, `quantify`, `tailor`, `comprehensive` |
| enhancementId | string | Yes | Globally unique enhancement identifier (format: `enhance_{type}_{random}`) |
| resumeId | string | Yes | Resume being enhanced |
| originalVersion | string | Yes | Version ID before enhancement |
| enhancedVersion | string | Yes | New version ID with enhanced content |
| jobTarget | object | No | Target job details (for tailor enhancement) |
| enhancementTypes | array | No | List of enhancement types applied (for comprehensive) |
| improvements | array | Yes | Detailed improvement descriptions |
| improvements[].category | string | Yes | Improvement category |
| improvements[].description | string | Yes | Human-readable description |
| improvements[].impact | string | Yes | Impact level: `low`, `medium`, `high` |
| improvements[].examples | array | No | Before/after examples |
| qualityMetrics | object | Yes | Quality assessment scores |
| qualityMetrics.readabilityScore | integer | No | Content readability (0-100) |
| qualityMetrics.impactScore | integer | No | Achievement impact (0-100) |
| qualityMetrics.keywordDensity | integer | No | Keyword optimization (0-100) |
| qualityMetrics.atsCompatibility | integer | No | ATS friendliness (0-100) |
| qualityMetrics.uniquenessScore | integer | No | Content originality (0-100) |
| qualityMetrics.overallImprovement | integer | No | Overall improvement percentage |
| enhancedContent | object | Yes | Complete enhanced resume content |
| changeSummary | object | No | Summary of content changes |
| changeSummary.sectionsModified | array | No | Sections that were modified |
| changeSummary.wordsAdded | integer | No | Words added to content |
| changeSummary.wordsRemoved | integer | No | Words removed from content |
| metadata | object | Yes | Enhancement processing metadata |
| metadata.aiModel | string | Yes | AI model used for enhancement |
| metadata.processingTimeMs | integer | Yes | Processing time in milliseconds |
| metadata.enhancementVersion | string | Yes | Enhancement algorithm version |
| metadata.confidence | number | Yes | AI confidence in improvements (0-1) |
| createdAt | string | Yes | ISO 8601 enhancement completion timestamp |

---

## Enhancement Request

```json
{
  "enhancementType": "optimize_content",
  "options": {
    "targetRole": "Senior Software Engineer",
    "improveClarity": true,
    "addMetrics": true,
    "enhanceKeywords": true
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| enhancementType | string | Yes | Type: `optimize_content`, `improve_formatting`, `add_sections` |
| options | object | No | Enhancement options |
| options.targetRole | string | No | Target role for optimization |
| options.improveClarity | boolean | No | Whether to improve clarity |
| options.addMetrics | boolean | No | Whether to add quantifiable metrics |
| options.enhanceKeywords | boolean | No | Whether to enhance keywords |

---

## Enhancement History Item

```json
{
  "jobId": "job_enhance_resume_def456uvw_1640995500",
  "enhancementType": "optimize_content",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:45.000Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| jobId | string | Enhancement job ID |
| enhancementType | string | Type of enhancement |
| status | string | Job status |
| createdAt | string | Creation timestamp |
| completedAt | string | Completion timestamp |

---

## Enhancement Statistics

```json
{
  "stats": {
    "totalEnhancements": 8,
    "successfulEnhancements": 7,
    "failedEnhancements": 1,
    "averageProcessingTime": 40000,
    "mostUsedType": "optimize_content",
    "lastEnhancedAt": "2024-01-01T00:00:45.000Z"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| totalEnhancements | integer | Total number of enhancements |
| successfulEnhancements | integer | Number of successful enhancements |
| failedEnhancements | integer | Number of failed enhancements |
| averageProcessingTime | integer | Average processing time in milliseconds |
| mostUsedType | string | Most frequently used enhancement type |
| lastEnhancedAt | string | ISO 8601 timestamp of last enhancement |

---

## Enhancement Template

```json
{
  "id": "ats_optimization",
  "name": "ATS Optimization",
  "description": "Optimize resume for ATS systems",
  "enhancementType": "optimize_content"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Template identifier |
| name | string | Template name |
| description | string | Template description |
| enhancementType | string | Enhancement type this template uses |

---

## Enhancement Search Result

```json
{
  "results": [
    {
      "jobId": "job_enhance_resume_def456uvw_1640995500",
      "enhancementType": "optimize_content",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| results | array | Array of enhancement results |
| results[].jobId | string | Enhancement job ID |
| results[].enhancementType | string | Enhancement type |
| results[].status | string | Job status |
| results[].createdAt | string | Creation timestamp |
| pagination | object | Pagination metadata (see Common Schemas) |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

