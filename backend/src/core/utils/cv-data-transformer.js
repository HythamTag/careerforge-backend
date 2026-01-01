// ============================================================================
// FILE: utils/cv-data-transformer.js
// ============================================================================

/**
 * CV DATA TRANSFORMER
 * 
 * Utility class for normalizing and transforming CV data.
 * Handles legacy formats and ensures consistent data structure.
 */

const { CV_CONTENT_DEFAULTS } = require('@constants');
const logger = require('./core/logger');

class CVDataTransformer {
  /**
   * Normalize CV data to match CreateCVPayload interface.
   * Now includes AI output cleaning and hallucination filtering.
   *
   * @param {Object} cvData - Raw or AI-parsed CV data
   * @param {Object} options - Normalization options
   * @returns {Object} Cleaned and structured CV data
   */
  static normalize(cvData, options = {}) {
    if (!cvData || typeof cvData !== 'object') {
      logger.warn('CVDataTransformer received invalid data', {
        cvDataType: typeof cvData,
        isNull: cvData === null,
      });
      return this.getDefaultStructure();
    }

    if (Object.keys(cvData).length === 0) {
      logger.warn('CVDataTransformer received empty object');
      return this.getDefaultStructure();
    }

    // Step 1: Clean AI quirks if requested (or by default for safety)
    let cleaned = cvData;
    if (options.isAIOutput !== false) {
      cleaned = this.cleanAIOutput(cvData);
    }

    // Step 2: Transform to standard structure
    return {
      title: cleaned.title || CV_CONTENT_DEFAULTS.TITLE,
      template: cleaned.template || CV_CONTENT_DEFAULTS.TEMPLATE,
      personalInfo: this.normalizePersonalInfo(cleaned.personalInfo || cleaned.personal),
      professionalSummary: cleaned.professionalSummary || cleaned.summary || '',
      workExperience: this.normalizeWorkExperience(cleaned.workExperience || cleaned.experience),
      education: this.normalizeEducation(cleaned.education),
      skills: this.normalizeSkills(cleaned.skills),
      projects: this.normalizeProjects(cleaned.projects),
      languages: this.normalizeLanguages(cleaned.languages),
      certifications: this.normalizeCertifications(cleaned.certifications),
      publications: this.normalizePublications(cleaned.publications),
    };
  }

  /**
   * Clean AI output by removing hallucinations and fixing quirks.
   * Merged from legacy CVNormalizer utility.
   *
   * @param {Object} cv - Raw data from AI
   * @returns {Object} Cleaned data
   */
  static cleanAIOutput(cv) {
    if (!cv || typeof cv !== 'object') return cv;

    logger.debug('Cleaning AI output for consistency', { operation: 'CVDataTransformer.cleanAIOutput' });

    // 1. Recursively convert empty strings to null or remove them
    let cleaned = this._normalizeEmptyStringsRecursive(cv);

    // 2. Filter invalid experience entries (must have company and title/role)
    if (Array.isArray(cleaned.workExperience || cleaned.experience)) {
      const expKey = cleaned.workExperience ? 'workExperience' : 'experience';
      cleaned[expKey] = cleaned[expKey].filter(exp => {
        const hasCompany = exp && typeof (exp.company) === 'string' && exp.company.trim() !== '';
        const hasRole = exp && typeof (exp.title || exp.role) === 'string' && (exp.title || exp.role).trim() !== '';
        return hasCompany && hasRole;
      });
    }

    // 3. Filter invalid education entries (must have institution)
    if (Array.isArray(cleaned.education)) {
      cleaned.education = cleaned.education.filter(edu =>
        edu && typeof edu.institution === 'string' && edu.institution.trim() !== ''
      );
    }

    // 4. Filter invalid projects (must have title/name)
    if (Array.isArray(cleaned.projects)) {
      cleaned.projects = cleaned.projects.filter(proj =>
        proj && typeof (proj.title || proj.name) === 'string' && (proj.title || proj.name).trim() !== ''
      );
    }

    // 5. Filter invalid certifications (must have name)
    if (Array.isArray(cleaned.certifications)) {
      cleaned.certifications = cleaned.certifications.filter(cert =>
        cert && typeof cert.name === 'string' && cert.name.trim() !== ''
      );
    }

    // 6. Filter hallucinated publications
    if (Array.isArray(cleaned.publications)) {
      cleaned.publications = cleaned.publications.filter(pub => {
        const hasTitle = pub && typeof pub.title === 'string' && pub.title.trim() !== '';
        // Strict Filter: Remove GitHub/Demo/Vercel links mascarading as publications
        const isProject = (pub.publisher || '').match(/github|vercel|netlify|demo|link|self/i) ||
          (pub.title || '').match(/demo|github/i);
        const hasVenue = pub && typeof (pub.venue || pub.publisher) === 'string' && (pub.venue || pub.publisher).trim() !== '';
        return hasTitle && hasVenue && !isProject;
      });
    }

    // 7. Filter invalid Education (Graduation Projects)
    if (Array.isArray(cleaned.education)) {
      cleaned.education = cleaned.education.filter(edu => {
        const isGradProject = (edu.degree || '').match(/graduation project/i) ||
          (edu.institution || '').match(/graduation project/i);
        return !isGradProject;
      });
    }

    return cleaned;
  }

  /**
   * Normalize personal information
   */
  static normalizePersonalInfo(personalInfo) {
    if (!personalInfo || typeof personalInfo !== 'object') {
      return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        links: [],
      };
    }

    // specific fix for unified parser outputting flat fields
    let links = this.normalizeLinks(personalInfo.links);

    // Map of flat fields to link labels
    const linkMappings = {
      'linkedin': 'LinkedIn',
      'github': 'GitHub',
      'website': 'Website',
      'portfolio': 'Portfolio'
    };

    // Auto-detect fields and add to links if not present
    for (const [field, label] of Object.entries(linkMappings)) {
      if (personalInfo[field] && typeof personalInfo[field] === 'string' && personalInfo[field].trim() !== '') {
        // Check if a link with this label or URL already exists
        const exists = links.some(l =>
          l.label.toLowerCase() === label.toLowerCase() ||
          l.url === personalInfo[field]
        );

        if (!exists) {
          links.push({
            label: label,
            url: this.sanitizeUrl(personalInfo[field])
          });
        }
      }
    }

    return {
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      country: personalInfo.country || '',
      city: personalInfo.city || '', // Added city support
      links: links,
    };
  }

  /**
   * Normalize links array
   */
  static normalizeLinks(links) {
    if (!Array.isArray(links)) return [];

    return links.map(link => ({
      label: link.label || link.platform || 'Link',
      url: this.sanitizeUrl(link.url),
    }));
  }

  /**
   * Normalize work experience
   */
  static normalizeWorkExperience(workExperience) {
    if (!Array.isArray(workExperience)) return [];

    return workExperience.map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      description: exp.description || '',
    }));
  }

  /**
   * Normalize education
   */
  static normalizeEducation(education) {
    if (!Array.isArray(education)) return [];

    return education.map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      location: edu.location || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      current: edu.current || false,
      description: edu.description || '',
    }));
  }

  /**
   * Normalize skills (handle legacy formats)
   */
  static normalizeSkills(skills) {
    if (!skills) return [];

    // Array Handling (Mixed formats)
    if (Array.isArray(skills)) {
      const grouped = {};

      skills.forEach(skill => {
        // String skill -> 'Key Skills'
        if (typeof skill === 'string') {
          const cat = 'Key Skills';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(skill);
        }
        // Object skill
        else if (typeof skill === 'object' && skill !== null) {
          const category = skill.category || 'Key Skills';

          // Case A: Already grouped { category: "Tech", skills: [...] }
          if (Array.isArray(skill.skills)) {
            if (!grouped[category]) grouped[category] = [];
            // Filter non-string skills inside the array just in case
            const validSkills = skill.skills.filter(s => typeof s === 'string');
            grouped[category].push(...validSkills);
          }
          // Case B: Flat skill { name: "Java", category: "Tech" } (Unified Parser output)
          else {
            const name = skill.name || skill.skill;
            if (name && typeof name === 'string') {
              if (!grouped[category]) grouped[category] = [];
              grouped[category].push(name);
            }
          }
        }
      });

      // Convert map to array
      return Object.entries(grouped).map(([category, skills]) => ({
        category,
        skills
      }));
    }

    // Legacy object format: { technical: [], soft: [] }
    if (typeof skills === 'object') {
      return Object.entries(skills).map(([key, val]) => ({
        category: key.charAt(0).toUpperCase() + key.slice(1),
        skills: Array.isArray(val) ? val : [],
      }));
    }

    return [];
  }

  /**
   * Normalize projects
   */
  static normalizeProjects(projects) {
    if (!Array.isArray(projects)) return [];

    return projects.map(project => ({
      title: project.title || '',
      description: project.description || '',
      url: this.sanitizeUrl(project.url),
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
    }));
  }

  /**
   * Normalize languages
   */
  static normalizeLanguages(languages) {
    if (!Array.isArray(languages)) return [];

    return languages.map(lang => ({
      name: lang.name || lang.language || 'Unknown',
      proficiency: lang.proficiency || 'Intermediate',
    }));
  }

  /**
   * Normalize certifications
   */
  static normalizeCertifications(certifications) {
    if (!Array.isArray(certifications)) return [];

    return certifications.map(cert => ({
      name: cert.name || '',
      company: cert.company || cert.issuer || '',
      startDate: cert.startDate || cert.date || '',
      description: cert.description || '',
      url: this.sanitizeUrl(cert.url),
    }));
  }

  /**
   * Normalize publications
   */
  static normalizePublications(publications) {
    if (!Array.isArray(publications)) return [];

    return publications.map(pub => ({
      title: pub.title || '',
      publisher: pub.publisher || pub.venue || '',
      date: pub.date || '',
      description: pub.description || '',
      url: this.sanitizeUrl(pub.url),
    }));
  }

  /**
   * Recursively normalize empty strings to null.
   * AI models often return "" instead of null.
   * @private
   */
  static _normalizeEmptyStringsRecursive(obj) {
    if (obj === '') return null;

    if (Array.isArray(obj)) {
      return obj.map(item => this._normalizeEmptyStringsRecursive(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const normalized = {};
      for (const key in obj) {
        normalized[key] = this._normalizeEmptyStringsRecursive(obj[key]);
      }
      return normalized;
    }

    return obj;
  }

  /**
   * Sanitize URL (handle array or string)
   */
  static sanitizeUrl(url) {
    if (Array.isArray(url)) return url[0] || '';
    return url || '';
  }

  /**
   * Get default CV structure
   */
  static getDefaultStructure() {
    return {
      title: CV_CONTENT_DEFAULTS.TITLE,
      template: CV_CONTENT_DEFAULTS.TEMPLATE,
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        links: [],
      },
      professionalSummary: '',
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      languages: [],

      certifications: [],
      publications: [],
    };
  }
}

module.exports = CVDataTransformer;

