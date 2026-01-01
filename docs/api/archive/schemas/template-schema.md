# Template Schema

## Template System Architecture

### Dual Template System

The CV Enhancer platform uses a **hybrid template architecture** with separate implementations for frontend live preview and backend PDF generation.

#### Frontend Templates (React Components)
- **Purpose**: Live, interactive preview during resume editing
- **Technology**: React components rendered client-side
- **Performance**: Instant feedback, no server round-trips
- **Usage**: Template selection and real-time editing
- **Data**: Resume data passed as props to components

#### Backend Templates (Handlebars + Puppeteer)
- **Purpose**: Professional PDF generation for downloads
- **Technology**: Handlebars templates + Puppeteer Chrome rendering
- **Performance**: High-quality output with consistent rendering
- **Usage**: Final document generation and export
- **Data**: Resume data injected into Handlebars templates

#### Integration Bridge
- **templateId**: Unique identifier linking frontend and backend templates
- **Configuration**: Shared template settings and styling rules
- **Validation**: Backend ensures template compatibility and access

### Template Object

Complete template configuration with customization options, compatibility requirements, and usage statistics.

### Template Categories

- **`modern`**: Modern and contemporary designs
- **`classic`**: Traditional and timeless layouts
- **`creative`**: Artistic and visually striking designs
- **`minimal`**: Clean, simple layouts focusing on content
- **`executive`**: High-level executive and leadership positions
- **`technical`**: Templates for IT, engineering, and technical roles
- **`academic`**: Templates optimized for academic and research positions
- **`creative_professional`**: Professional templates with creative elements

### Template Status Values

- **`active`**: Template is available for use
- **`deprecated`**: Template is still usable but will be removed soon
- **`beta`**: Template is in beta testing phase
- **`archived`**: Template is no longer available

### Examples by Category

#### Professional Template (Active)
```json
{
  "id": "modern-professional",
  "slug": "modern-professional",
  "name": "Modern Professional",
  "description": "Clean two-column layout with subtle accent colors, perfect for corporate environments",
  "category": "professional",
  "status": "active",
  "atsScore": 95,
  "compatibility": {
    "pdf": true,
    "docx": true,
    "html": true,
    "minimumResumeLength": 200,
    "maximumResumeLength": 2000
  },
  "preview": {
    "thumbnail": "/templates/previews/modern-professional-thumb.png",
    "fullSize": "/templates/previews/modern-professional-full.png",
    "samplePdf": "/templates/samples/modern-professional-sample.pdf"
  },
  "features": [
    "Two-column layout",
    "Color accent customization",
    "ATS-optimized formatting",
    "Professional typography",
    "Contact info highlighting",
    "Skills section emphasis",
    "Experience timeline"
  ],
  "parameters": {
    "layout": {
      "type": "select",
      "options": ["two-column", "single-column"],
      "default": "two-column",
      "description": "Choose between single or two-column layout"
    },
    "colorScheme": {
      "type": "select",
      "options": ["blue", "green", "red", "gray", "purple"],
      "default": "blue",
      "description": "Primary accent color for the template"
    },
    "fontSize": {
      "type": "range",
      "min": 10,
      "max": 14,
      "step": 1,
      "default": 12,
      "unit": "pt",
      "description": "Base font size for body text"
    },
    "showPhoto": {
      "type": "boolean",
      "default": false,
      "description": "Include profile photo in header"
    },
    "sectionOrder": {
      "type": "multiselect",
      "options": ["summary", "experience", "education", "skills", "projects", "certifications"],
      "default": ["summary", "experience", "education", "skills"],
      "required": ["experience"],
      "description": "Order and visibility of resume sections"
    }
  },
  "requirements": {
    "minimumSections": ["experience", "education"],
    "recommendedSections": ["summary", "skills"],
    "maximumSections": 8
  },
  "statistics": {
    "usageCount": 15420,
    "averageRating": 4.6,
    "popularityRank": 3,
    "conversionRate": 0.85,
    "lastUsedAt": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "author": "CV Enhancer Design Team",
    "version": "2.1.0",
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2024-01-10T00:00:00.000Z",
    "tags": ["corporate", "modern", "clean"],
    "industries": ["technology", "finance", "consulting"]
  },
  "pricing": {
    "tier": "free",
    "isPremium": false
  }
}
```

#### Creative Template (Premium)
```json
{
  "id": "creative-portfolio",
  "slug": "creative-portfolio",
  "name": "Creative Portfolio",
  "description": "Bold, artistic layout with custom graphics and unique typography for creative professionals",
  "category": "creative",
  "status": "premium",
  "atsScore": 75,
  "compatibility": {
    "pdf": true,
    "docx": false,
    "html": true,
    "minimumResumeLength": 150,
    "maximumResumeLength": 1500,
    "atsWarning": "Creative layouts may not parse perfectly in ATS systems"
  },
  "preview": {
    "thumbnail": "/templates/previews/creative-portfolio-thumb.png",
    "fullSize": "/templates/previews/creative-portfolio-full.png",
    "portfolio": "/templates/samples/creative-portfolio-portfolio.pdf"
  },
  "features": [
    "Unique typography",
    "Custom graphics integration",
    "Portfolio showcase section",
    "Creative color schemes",
    "Non-traditional layout",
    "Visual elements",
    "Brand customization"
  ],
  "parameters": {
    "artworkStyle": {
      "type": "select",
      "options": ["geometric", "organic", "minimalist", "bold"],
      "default": "geometric",
      "description": "Artistic style for decorative elements"
    },
    "primaryColor": {
      "type": "color",
      "default": "#FF6B6B",
      "description": "Primary brand color"
    },
    "secondaryColor": {
      "type": "color",
      "default": "#4ECDC4",
      "description": "Secondary accent color"
    },
    "includePortfolio": {
      "type": "boolean",
      "default": true,
      "description": "Include portfolio/projects section"
    }
  },
  "requirements": {
    "minimumSections": ["experience"],
    "recommendedSections": ["portfolio", "skills"],
    "maximumSections": 6,
    "contentTypes": ["text", "images", "links"]
  },
  "statistics": {
    "usageCount": 3250,
    "averageRating": 4.8,
    "popularityRank": 15,
    "conversionRate": 0.92,
    "lastUsedAt": "2024-01-15T08:45:00.000Z"
  },
  "metadata": {
    "author": "Creative Design Studio",
    "version": "1.3.0",
    "createdAt": "2023-09-15T00:00:00.000Z",
    "updatedAt": "2024-01-05T00:00:00.000Z",
    "tags": ["artistic", "portfolio", "bold", "creative"],
    "industries": ["design", "marketing", "advertising", "media"]
  },
  "pricing": {
    "tier": "premium",
    "isPremium": true,
    "price": 4.99
  }
}
```

#### Academic Template (Active)
```json
{
  "id": "academic-research",
  "slug": "academic-research",
  "name": "Academic Research",
  "description": "Structured template optimized for academic positions with emphasis on publications and research",
  "category": "academic",
  "status": "active",
  "atsScore": 90,
  "compatibility": {
    "pdf": true,
    "docx": true,
    "html": true,
    "minimumResumeLength": 250,
    "maximumResumeLength": 2500,
    "academicFocus": true
  },
  "preview": {
    "thumbnail": "/templates/previews/academic-research-thumb.png",
    "fullSize": "/templates/previews/academic-research-full.png",
    "samplePdf": "/templates/samples/academic-research-sample.pdf"
  },
  "features": [
    "Publications section",
    "Research experience emphasis",
    "Conference presentations",
    "Academic achievements",
    "Teaching experience",
    "Grants and funding",
    "Professional memberships"
  ],
  "parameters": {
    "emphasisArea": {
      "type": "select",
      "options": ["research", "teaching", "clinical", "administrative"],
      "default": "research",
      "description": "Primary focus area for the academic CV"
    },
    "includePublications": {
      "type": "boolean",
      "default": true,
      "description": "Include detailed publications section"
    },
    "citationStyle": {
      "type": "select",
      "options": ["APA", "MLA", "Chicago", "AMA"],
      "default": "APA",
      "description": "Citation style for publications"
    }
  },
  "requirements": {
    "minimumSections": ["experience", "education"],
    "recommendedSections": ["publications", "research", "teaching"],
    "maximumSections": 10,
    "academicFields": ["publications", "grants", "presentations", "teaching"]
  },
  "statistics": {
    "usageCount": 8750,
    "averageRating": 4.7,
    "popularityRank": 8,
    "conversionRate": 0.88,
    "lastUsedAt": "2024-01-15T11:20:00.000Z"
  },
  "metadata": {
    "author": "Academic CV Experts",
    "version": "3.2.0",
    "createdAt": "2023-03-01T00:00:00.000Z",
    "updatedAt": "2024-01-08T00:00:00.000Z",
    "tags": ["academic", "research", "publications", "teaching"],
    "industries": ["education", "research", "healthcare", "government"]
  },
  "pricing": {
    "tier": "free",
    "isPremium": false
  }
}
```

### Template ID in Generation Requests

The `id` field serves as the `templateId` parameter in CV generation requests:

```json
// CV Generation Request
POST /v1/resumes/:resumeId/generate
{
  "versionId": "version_abc123",
  "templateId": "modern-professional",  // ← This comes from template.id
  "outputFormat": "pdf"
}
```

**Frontend Usage:**
- Template `id` is used for frontend template selection
- User selects template → frontend stores `templateId`
- Download request sends `templateId` to backend
- Backend validates template and generates PDF

**Backend Processing:**
- Receives `templateId` in generation request
- Loads template configuration from database
- Renders Handlebars template → HTML
- Uses Puppeteer to generate PDF from HTML

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Globally unique template identifier (format: `template_{random}` or descriptive slug) |
| slug | string | Yes | URL-friendly identifier for template access |
| name | string | Yes | Human-readable template display name |
| description | string | Yes | Detailed description of template style and purpose |
| category | string | Yes | Template category: `professional`, `creative`, `minimal`, `academic`, `technical`, `executive`, `entry-level`, `industry-specific` |
| status | string | Yes | Template availability status: `active`, `deprecated`, `beta`, `archived` |
| atsScore | integer | No | ATS compatibility score (0-100, higher is better) |
| compatibility | object | Yes | Template compatibility requirements and warnings |
| compatibility.pdf | boolean | Yes | Supports PDF export |
| compatibility.docx | boolean | Yes | Supports DOCX export |
| compatibility.html | boolean | Yes | Supports HTML export |
| compatibility.minimumResumeLength | integer | No | Minimum recommended resume word count |
| compatibility.maximumResumeLength | integer | No | Maximum recommended resume word count |
| compatibility.atsWarning | string | No | ATS compatibility warnings |
| preview | object | No | Preview and sample assets |
| preview.thumbnail | string | No | Small thumbnail image URL |
| preview.fullSize | string | No | Full-size preview image URL |
| preview.samplePdf | string | No | Sample PDF URL |
| features | array | Yes | Array of feature descriptions |
| parameters | object | No | Customization parameter definitions |
| requirements | object | No | Content requirements for optimal use |
| requirements.minimumSections | array | No | Required sections for template |
| requirements.recommendedSections | array | No | Recommended sections |
| requirements.maximumSections | integer | No | Maximum number of sections |
| statistics | object | No | Usage and popularity statistics |
| statistics.usageCount | integer | No | Total number of times used |
| statistics.averageRating | number | No | Average user rating (1-5) |
| statistics.popularityRank | integer | No | Popularity ranking |
| statistics.conversionRate | number | No | User satisfaction/conversion rate |
| statistics.lastUsedAt | string | No | ISO 8601 last usage timestamp |
| metadata | object | Yes | Template metadata and authorship |
| metadata.author | string | Yes | Template author/creator |
| metadata.version | string | Yes | Template version (semantic versioning) |
| metadata.createdAt | string | Yes | ISO 8601 creation timestamp |
| metadata.updatedAt | string | Yes | ISO 8601 last update timestamp |
| metadata.tags | array | No | Descriptive tags |
| metadata.industries | array | No | Recommended industries |
| pricing | object | Yes | Pricing and availability information |
| pricing.tier | string | Yes | Subscription tier required: `free`, `premium` |
| pricing.isPremium | boolean | Yes | Whether template requires premium subscription |
| pricing.price | number | No | Monthly price for premium templates |

---

## Parameter Types

Templates support various parameter types for customization. Each parameter type has specific validation rules and UI rendering requirements.

### Select Parameter
Used for choosing from predefined options.

```json
{
  "type": "select",
  "options": ["option1", "option2", "option3"],
  "default": "option1",
  "description": "Choose from predefined options",
  "required": false,
  "validation": {
    "allowEmpty": false
  }
}
```

### Range Parameter
Numeric values within a specified range.

```json
{
  "type": "range",
  "min": 10,
  "max": 20,
  "step": 1,
  "default": 12,
  "unit": "pt",
  "description": "Numeric value within range",
  "required": false,
  "validation": {
    "min": 10,
    "max": 20,
    "step": 1
  }
}
```

### Boolean Parameter
Simple true/false toggle.

```json
{
  "type": "boolean",
  "default": true,
  "description": "Enable or disable feature",
  "required": false,
  "validation": {}
}
```

### Color Parameter
Color picker with hex/rgb support.

```json
{
  "type": "color",
  "default": "#007ACC",
  "format": "hex",
  "description": "Color selection",
  "required": false,
  "validation": {
    "format": "hex",
    "allowTransparent": false
  }
}
```

### Multiselect Parameter
Multiple selection from options list.

```json
{
  "type": "multiselect",
  "options": ["item1", "item2", "item3", "item4"],
  "default": ["item1", "item2"],
  "min": 1,
  "max": 3,
  "description": "Select multiple items",
  "required": false,
  "validation": {
    "min": 1,
    "max": 3,
    "allowDuplicates": false
  }
}
```

### Text Parameter
Free-form text input with length limits.

```json
{
  "type": "text",
  "default": "Default text",
  "maxLength": 100,
  "minLength": 0,
  "placeholder": "Enter custom text",
  "description": "Free-form text input",
  "required": false,
  "validation": {
    "maxLength": 100,
    "minLength": 0,
    "pattern": null
  }
}
```

### Validation Rules

All parameters support common validation rules:

```json
{
  "required": true,           // Parameter must be provided
  "allowEmpty": false,        // Empty values not allowed
  "customValidator": "func",  // Custom validation function
  "dependsOn": "otherParam",  // Parameter depends on another
  "conditional": {            // Conditional validation
    "when": "layout",
    "equals": "two-column",
    "then": {"required": true}
  }
}
```

---

## Template Validation Rules

Templates include validation rules to ensure content quality and compatibility.

### Content Validation
```json
{
  "sections": {
    "required": ["experience", "education"],
    "recommended": ["summary", "skills"],
    "maximum": 8,
    "ordering": {
      "fixed": ["contact"],
      "flexible": ["summary", "experience", "education", "skills"]
    }
  },
  "content": {
    "minimumWords": 100,
    "maximumWords": 1000,
    "requiredFields": ["name", "email", "phone"],
    "formatChecks": {
      "email": "rfc5322",
      "phone": "e164",
      "date": "iso8601"
    }
  },
  "compatibility": {
    "atsFriendly": true,
    "mobileOptimized": true,
    "printFriendly": true,
    "accessibility": {
      "wcagLevel": "AA",
      "colorContrast": true,
      "screenReader": true
    }
  }
}
```

### Template Compatibility Matrix

| Template Type | PDF | DOCX | HTML | ATS Score | Accessibility |
|---------------|-----|------|------|-----------|---------------|
| Professional  | ✅  | ✅   | ✅   | 90-100    | ✅           |
| Creative      | ✅  | ❌   | ✅   | 70-85     | ⚠️           |
| Minimal       | ✅  | ✅   | ✅   | 85-95     | ✅           |
| Academic      | ✅  | ✅   | ✅   | 85-95     | ✅           |
| Technical     | ✅  | ✅   | ✅   | 80-95     | ✅           |
| Executive     | ✅  | ✅   | ✅   | 85-100    | ✅           |
| Entry-Level   | ✅  | ✅   | ✅   | 80-90     | ✅           |

---

## Template List Item

Simplified template object for list responses.

```json
{
  "id": "modern",
  "name": "Modern",
  "description": "Clean two-column layout with accent colors",
  "category": "professional",
  "atsScore": 95,
  "preview": "/templates/previews/modern.png",
  "features": ["Two-column", "Color accents", "ATS-friendly"]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Template ID |
| name | string | Template name |
| description | string | Template description |
| category | string | Template category |
| atsScore | integer | ATS compatibility score |
| preview | string | Preview image URL |
| features | array | Feature list |

---

## Template Category

```json
{
  "id": "professional",
  "name": "Professional",
  "count": 5
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Category identifier |
| name | string | Category display name |
| count | integer | Number of templates in this category |

---

## Template Statistics

```json
{
  "stats": {
    "totalTemplates": 10,
    "totalUsage": 5000,
    "mostPopular": {
      "id": "modern",
      "usageCount": 1250
    }
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| totalTemplates | integer | Total number of templates |
| totalUsage | integer | Total usage count across all templates |
| mostPopular | object | Most popular template |
| mostPopular.id | string | Template ID |
| mostPopular.usageCount | integer | Usage count |

---

## Template Analytics

```json
{
  "analytics": {
    "period": "month",
    "templates": [
      {
        "id": "modern",
        "usageCount": 250,
        "averageRating": 4.8
      }
    ]
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| period | string | Time period: `week`, `month`, `year` |
| templates | array | Template analytics data |
| templates[].id | string | Template ID |
| templates[].usageCount | integer | Usage count for period |
| templates[].averageRating | number | Average user rating |

---

## Template Recommendation

```json
{
  "id": "modern",
  "name": "Modern",
  "reason": "High ATS score and matches your industry",
  "score": 0.95
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Template ID |
| name | string | Template name |
| reason | string | Reason for recommendation |
| score | number | Recommendation score (0-1) |

---

## Template Validation Request

```json
{
  "templateId": "modern",
  "parameters": {
    "fontSize": 12,
    "colorScheme": "blue"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | string | Yes | Template ID to validate |
| parameters | object | No | Template parameters to validate |

---

## Template Validation Response

```json
{
  "valid": true,
  "errors": []
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| valid | boolean | Whether configuration is valid |
| errors | array | Array of validation error messages |

---

## Template Sample

```json
{
  "sample": {
    "content": {
      "personal": { "name": "John Doe" },
      "experience": []
    },
    "renderedUrl": "https://example.com/samples/modern-sample.pdf"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| sample | object | Sample data |
| sample.content | object | Sample resume content |
| sample.renderedUrl | string | URL to rendered sample PDF |

---

## Template Preview

```json
{
  "preview": {
    "url": "https://example.com/templates/previews/modern.png",
    "thumbnail": "https://example.com/templates/previews/modern-thumb.png"
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| preview | object | Preview information |
| preview.url | string | Full-size preview image URL |
| preview.thumbnail | string | Thumbnail preview image URL |

---

**Last Updated:** 2024-12-28  
**API Version:** v1  
**Schema Version:** 1.0.0

