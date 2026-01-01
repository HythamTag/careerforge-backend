# Parsed Data Schema

## Parsing Result Object

Structure of the data returned by the AI parser and stored in the job results.

### Sample Result
```json
{
  "jobId": "parse_123456789",
  "status": "completed",
  "progress": 100,
  "result": {
    "parsedContent": {
      "personal": {
        "name": "Sarah Johnson",
        "email": "sarah.j@example.com",
        "phone": "+1-555-0123",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/sarahj",
        "website": "sarahj.me",
        "summary": "Experienced Product Manager..."
      },
      "experience": [
        {
          "company": "Tech Corp",
          "position": "Senior PM",
          "startDate": "2021-01",
          "endDate": "Present",
          "description": "Led product discovery...",
          "technologies": ["Jira", "Mixpanel"],
          "achievements": ["Launched X feature", "Grew user base by 20%"]
        }
      ],
      "education": [
        {
          "institution": "Stanford University",
          "degree": "B.S.",
          "field": "Computer Science",
          "startDate": "2016",
          "endDate": "2020",
          "gpa": "3.9",
          "honors": ["Dean's List"]
        }
      ],
      "skills": [
        {
          "category": "Programming",
          "skills": ["JavaScript", "Python"],
          "proficiency": "advanced"
        }
      ],
      "projects": [],
      "languages": [
        { "name": "English", "proficiency": "native" }
      ]
    },
    "confidence": 0.95,
    "processingTime": 12500,
    "pagesProcessed": 2,
    "sectionsFound": ["personal", "experience", "education", "skills"]
  }
}
```

### Data Structure Details

#### 1. Personal Info
- `name`: Full name
- `email`: Contact email
- `phone`: Phone number
- `location`: Physical address/city
- `summary`: Short professional overview

#### 2. Experience
Array of objects containing:
- `company`: Employer name
- `position`: Job title
- `startDate`/`endDate`: Dates (usually YYYY-MM)
- `description`: Bulk text
- `achievements`: Array of specific bullet points

#### 3. Education
Array of objects containing:
- `institution`: School name
- `degree`: Level of study
- `field`: Major
- `gpa`: (Optional)

#### 4. Skills
Array of objects containing:
- `category`: e.g., "Programming", "Tools"
- `skills`: Array of strings
- `proficiency`: `beginner`, `intermediate`, `advanced`, `expert`

---
**Last Updated:** 2026-01-01
