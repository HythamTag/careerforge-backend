# ATS Analysis Schema

## ATS Analysis Result

Complete ATS compatibility analysis with detailed scoring, keyword analysis, and actionable recommendations.

### ATS Score Components (100 points total)

- **Structure (40 points)**: Resume organization and ATS parsing friendliness
- **Skills Visibility (25 points)**: How well skills are presented and discoverable
- **Experience Quality (25 points)**: Achievement quantification and relevance
- **Formatting Safety (10 points)**: ATS-safe formatting and layout choices

### Analysis Types

- **`compatibility`**: ATS compatibility check
- **`keyword_analysis`**: Keyword analysis and optimization
- **`format_check`**: Resume format validation
- **`comprehensive`**: Full comprehensive analysis

### Recommendation Categories

- **`content`**: Writing quality and content improvements
- **`keywords`**: Keyword optimization and density
- **`structure`**: Resume organization and formatting
- **`formatting`**: ATS-safe layout and design choices
- **`tailoring`**: Job-specific customization suggestions

### Examples by Analysis Type

#### Comprehensive ATS Analysis
```json
{
  "analysisId": "ats_comprehensive_123",
  "resumeId": "resume_active123",
  "analysisType": "comprehensive",
  "score": 78,
  "grade": "B",
  "breakdown": {
    "structure": 32,
    "skillsVisibility": 20,
    "experienceQuality": 18,
    "formattingSafety": 8,
    "maxScore": 100
  },
  "componentScores": {
    "contactInfo": 95,
    "summarySection": 72,
    "experienceSection": 65,
    "educationSection": 88,
    "skillsSection": 75,
    "overallFormatting": 82
  },
  "feedback": {
    "overallAssessment": "Good foundation with room for optimization",
    "strengths": [
      "Clean, professional formatting",
      "Strong education credentials",
      "Good contact information visibility"
    ],
    "weaknesses": [
      "Limited quantifiable achievements",
      "Skills section could be more prominent",
      "Summary lacks specific keywords"
    ],
    "criticalIssues": [],
    "opportunities": [
      "Add metrics to experience descriptions",
      "Optimize keyword placement",
      "Improve section hierarchy"
    ]
  },
  "recommendations": [
    {
      "id": "rec_quantify_achievements",
      "category": "content",
      "priority": "high",
      "title": "Add Quantifiable Achievements",
      "description": "Replace generic descriptions with specific metrics and results",
      "impact": "high",
      "effort": "medium",
      "examples": [
        {
          "before": "Managed team projects",
          "after": "Led cross-functional team of 8 developers on 12+ projects, delivering $2M in cost savings"
        }
      ],
      "estimatedScoreImprovement": 12
    },
    {
      "id": "rec_keyword_optimization",
      "category": "keywords",
      "priority": "high",
      "title": "Optimize Keyword Usage",
      "description": "Incorporate relevant keywords naturally throughout resume",
      "impact": "high",
      "effort": "low",
      "missingKeywords": ["agile", "scrum", "typescript", "aws"],
      "keywordSuggestions": [
        "Replace 'JavaScript' with 'TypeScript' where applicable",
        "Add 'AWS' certifications to skills section",
        "Include 'Agile/Scrum' methodology experience"
      ]
    },
    {
      "id": "rec_section_ordering",
      "category": "structure",
      "priority": "medium",
      "title": "Optimize Section Ordering",
      "description": "Place most relevant sections higher for better ATS parsing",
      "currentOrder": ["contact", "summary", "experience", "education", "skills"],
      "suggestedOrder": ["contact", "summary", "skills", "experience", "education"],
      "reasoning": "Skills section should appear before experience for keyword prominence"
    }
  ],
  "keywords": {
    "analysis": {
      "totalKeywords": 45,
      "uniqueKeywords": 38,
      "keywordDensity": 0.035,
      "optimalDensity": 0.045
    },
    "matched": [
      {"keyword": "javascript", "frequency": 3, "relevance": 0.9},
      {"keyword": "react", "frequency": 2, "relevance": 0.95},
      {"keyword": "node.js", "frequency": 1, "relevance": 0.8}
    ],
    "missing": [
      {"keyword": "typescript", "importance": "high", "suggestedPlacements": ["skills", "experience"]},
      {"keyword": "aws", "importance": "medium", "suggestedPlacements": ["skills", "projects"]},
      {"keyword": "docker", "importance": "medium", "suggestedPlacements": ["skills", "experience"]}
    ],
    "overused": [],
    "underutilized": ["python", "sql", "git"]
  },
  "targetJob": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "Senior engineer needed with React, Node.js, and cloud experience...",
    "requiredSkills": ["react", "node.js", "typescript", "aws", "docker"],
    "preferredSkills": ["kubernetes", "python", "agile"],
    "matchScore": 75
  },
  "atsCompatibility": {
    "parsingConfidence": 92,
    "formatSafety": 88,
    "structureScore": 85,
    "potentialIssues": [
      {
        "type": "formatting",
        "severity": "low",
        "description": "Complex table in experience section may not parse correctly",
        "solution": "Convert table to simple bullet points"
      }
    ]
  },
  "metadata": {
    "analysisEngine": "ats-analyzer-v2.1",
    "analysisVersion": "2024.1",
    "processingTimeMs": 35000,
    "benchmarkData": {
      "industryAverage": 72,
      "topQuartile": 85,
      "percentileRank": 68
    }
  },
  "createdAt": "2024-01-15T14:00:00.000Z"
}
```

#### Keywords-Only Analysis
```json
{
  "analysisId": "ats_keywords_456",
  "analysisType": "keywords_only",
  "keywords": {
    "analysis": {
      "totalKeywords": 42,
      "keywordDensity": 0.038,
      "optimalDensity": 0.045
    },
    "matched": [
      {"keyword": "javascript", "relevance": 0.9, "frequency": 3},
      {"keyword": "react", "relevance": 0.95, "frequency": 2}
    ],
    "missing": [
      {"keyword": "typescript", "importance": "high"},
      {"keyword": "aws", "importance": "medium"}
    ]
  },
  "targetJob": {
    "requiredSkills": ["typescript", "react", "aws"],
    "matchScore": 65
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| analysisId | string | Yes | Globally unique analysis identifier (format: `ats_{type}_{random}`) |
| resumeId | string | Yes | Resume being analyzed |
| analysisType | string | Yes | Analysis type: `comprehensive`, `keywords_only`, `structure_only`, `compatibility_check` |
| score | integer | Yes | Overall ATS score (0-100) |
| grade | string | No | Letter grade: `A`, `B`, `C`, `D`, `F` |
| breakdown | object | Yes | Score breakdown by component |
| breakdown.structure | integer | Yes | Structure score (0-40) |
| breakdown.skillsVisibility | integer | Yes | Skills visibility score (0-25) |
| breakdown.experienceQuality | integer | Yes | Experience quality score (0-25) |
| breakdown.formattingSafety | integer | Yes | Formatting safety score (0-10) |
| componentScores | object | No | Detailed component scores |
| feedback | object | Yes | Detailed feedback and assessment |
| feedback.overallAssessment | string | Yes | Overall assessment summary |
| feedback.strengths | array | Yes | Resume strengths identified |
| feedback.weaknesses | array | Yes | Areas needing improvement |
| feedback.criticalIssues | array | No | Critical ATS-blocking issues |
| feedback.opportunities | array | Yes | Improvement opportunities |
| recommendations | array | Yes | Actionable recommendations |
| recommendations[].id | string | Yes | Recommendation identifier |
| recommendations[].category | string | Yes | Category: `content`, `keywords`, `structure`, `formatting`, `tailoring` |
| recommendations[].priority | string | Yes | Priority: `low`, `medium`, `high`, `critical` |
| recommendations[].title | string | Yes | Recommendation title |
| recommendations[].description | string | Yes | Detailed description |
| recommendations[].impact | string | Yes | Expected impact: `low`, `medium`, `high` |
| recommendations[].effort | string | Yes | Implementation effort: `low`, `medium`, `high` |
| recommendations[].estimatedScoreImprovement | integer | No | Expected score improvement |
| keywords | object | Yes | Keyword analysis results |
| keywords.analysis | object | No | Keyword statistics |
| keywords.matched | array | Yes | Keywords found in resume |
| keywords.missing | array | Yes | Important keywords missing |
| keywords.overused | array | No | Keywords used too frequently |
| keywords.underutilized | array | No | Relevant keywords underutilized |
| targetJob | object | No | Target job analysis (if provided) |
| atsCompatibility | object | No | Detailed ATS compatibility metrics |
| metadata | object | Yes | Analysis metadata |
| metadata.analysisEngine | string | Yes | Analysis engine version |
| metadata.processingTimeMs | integer | Yes | Analysis processing time |
| createdAt | string | Yes | ISO 8601 analysis completion timestamp |
    "company": "Tech Corp"
  },
  "analyzedAt": "2024-01-01T00:00:00.000Z"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| score | integer | Yes | Overall ATS score (0-100) |
| breakdown | object | Yes | Score breakdown by category |
| breakdown.structure | integer | Yes | Structure score (0-100) |
| breakdown.skillsVisibility | integer | Yes | Skills visibility score (0-100) |
| breakdown.experienceQuality | integer | Yes | Experience quality score (0-100) |
| breakdown.formattingSafety | integer | Yes | Formatting safety score (0-100) |
| suggestions | array | No | Array of improvement suggestions |
| feedback | object | Yes | Detailed feedback object |
| feedback.strengths | array | Yes | Array of identified strengths |
| feedback.weaknesses | array | Yes | Array of identified weaknesses |
| feedback.recommendations | array | Yes | Array of specific recommendations |
| keywords | object | Yes | Keyword analysis |
| keywords.matched | array | Yes | Keywords found in resume |
| keywords.missing | array | Yes | Important keywords missing from resume |
| targetJob | object | Target job information |
| targetJob.title | string | Job title |
| targetJob.company | string | Company name |
| analyzedAt | string | ISO 8601 timestamp of analysis |

---

## ATS Analysis Request

```json
{
  "versionId": "version_abc123xyz",
  "type": "comprehensive",
  "priority": "medium",
  "targetJob": {
    "title": "Senior Software Engineer",
    "description": "We are looking for an experienced software engineer...",
    "company": "Tech Corp",
    "location": "New York, NY"
  },
  "parameters": {
    "includeSuggestions": true,
    "detailedBreakdown": true
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| versionId | string | No | Globally unique version ID (uses active if not provided) |
| type | string | No | Analysis type: `comprehensive`, `quick` (default: comprehensive) |
| priority | string | No | Job priority: `low`, `medium`, `high` (default: medium) |
| targetJob | object | Yes | Target job information |
| targetJob.title | string | Yes | Job title |
| targetJob.description | string | Yes | Full job description |
| targetJob.company | string | No | Company name |
| targetJob.location | string | No | Job location |
| parameters | object | No | Analysis parameters |
| parameters.includeSuggestions | boolean | No | Whether to include suggestions |
| parameters.detailedBreakdown | boolean | No | Whether to include detailed breakdown |

---

## ATS Analysis History Item

```json
{
  "jobId": "job_analyze_resume_def456uvw_1640995400",
  "targetJob": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp"
  },
  "score": 85,
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:30.000Z"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| jobId | string | Analysis job ID |
| targetJob | object | Target job information |
| targetJob.title | string | Job title |
| targetJob.company | string | Company name |
| score | integer | ATS score |
| status | string | Analysis status |
| createdAt | string | Creation timestamp |
| completedAt | string | Completion timestamp |

---

## ATS Analysis Statistics

```json
{
  "stats": {
    "totalAnalyses": 10,
    "averageScore": 82.5,
    "highestScore": 95,
    "lowestScore": 65,
    "lastAnalyzedAt": "2024-01-01T00:00:30.000Z"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| totalAnalyses | integer | Total number of analyses |
| averageScore | number | Average ATS score |
| highestScore | integer | Highest ATS score achieved |
| lowestScore | integer | Lowest ATS score achieved |
| lastAnalyzedAt | string | ISO 8601 timestamp of last analysis |

---

## ATS Analysis Trends

```json
{
  "trends": {
    "period": "month",
    "data": [
      {
        "date": "2024-01-01",
        "averageScore": 80,
        "count": 3
      },
      {
        "date": "2024-01-02",
        "averageScore": 85,
        "count": 2
      }
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| period | string | Time period: `week`, `month`, `year` |
| data | array | Trend data points |
| data[].date | string | Date (YYYY-MM-DD) |
| data[].averageScore | number | Average score for that date |
| data[].count | integer | Number of analyses on that date |

---

## Recent Scores

```json
{
  "analyses": [
    {
      "jobId": "job_analyze_resume_def456uvw_1640995400",
      "score": 85,
      "targetJob": {
        "title": "Senior Software Engineer",
        "company": "Tech Corp"
      },
      "analyzedAt": "2024-01-01T00:00:30.000Z"
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| analyses | array | Array of recent analyses |
| analyses[].jobId | string | Analysis job ID |
| analyses[].score | integer | ATS score |
| analyses[].targetJob | object | Target job information |
| analyses[].analyzedAt | string | Analysis timestamp |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

