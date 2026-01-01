/**
 * ============================================================================
 * cv.constants.js - CV Module Constants (Pure Static)
 * ============================================================================
 */

/**
 * CV Source Types
 * Defines how a CV was created
 */
const CV_SOURCE = Object.freeze({
  MANUAL: 'manual',
  UPLOAD: 'upload',
  GENERATED: 'generated',
  PARSED: 'parsed',
});

/**
 * CV Version Change Types
 * Defines the type of change that created a version
 */
const CV_VERSION_CHANGE_TYPE = Object.freeze({
  MANUAL: 'manual',
  AUTO_SAVE: 'auto_save',
  AI_GENERATED: 'ai_generated',
  AI_OPTIMIZED: 'ai_optimized',
  IMPORTED: 'imported',
});

/**
 * CV Version Names
 * Standard names for automatically created versions
 */
const CV_VERSION_NAMES = Object.freeze({
  INITIAL: 'Initial version',
  CONTENT_UPDATED: 'Content updated',
  DUPLICATED: 'Duplicated from another CV',
  BEFORE_RESTORE: 'Before version restore',
  MANUAL_CREATION: 'Manual version creation',
  RESTORED: (versionNumber) => `Restored from version ${versionNumber}`,
});

/**
 * CV Version Descriptions
 * Standard descriptions for automatically created versions
 */
const CV_VERSION_DESCRIPTIONS = Object.freeze({
  INITIAL: 'First version of the CV',
  CONTENT_UPDATED: 'Content updated',
  DUPLICATED: 'Duplicated from another CV',
  BEFORE_RESTORE: (versionNumber) => `Content saved before restoring version ${versionNumber}`,
  RESTORED: (versionNumber) => `Content restored from version ${versionNumber}`,
});

/**
 * CV Content Sections
 * Standard section names in CV content structure
 */
const CV_CONTENT_SECTIONS = Object.freeze([
  'personal',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'publications',
  'awards',
  'volunteer',
]);

/**
 * CV Settings Defaults
 * Default values for CV settings
 */
const CV_SETTINGS_DEFAULTS = Object.freeze({
  THEME: 'professional',
  LANGUAGE: 'en',
  FONT_SIZE: 'medium',
  PAGE_FORMAT: 'a4',
  MARGINS: 'normal',
});

/**
 * CV Content Defaults
 * Default values for CV content structure
 */
const CV_CONTENT_DEFAULTS = Object.freeze({
  TITLE: 'Untitled CV',
  TEMPLATE: 'modern',
});

/**
 * CV Settings Options
 * Available options for CV settings
 */
const CV_SETTINGS_OPTIONS = Object.freeze({
  THEMES: Object.freeze(['professional', 'modern', 'creative', 'minimal']),
  FONT_SIZES: Object.freeze(['small', 'medium', 'large']),
  PAGE_FORMATS: Object.freeze(['a4', 'letter', 'legal']),
  MARGINS: Object.freeze(['narrow', 'normal', 'wide']),
});

/**
 * CV Bulk Operations
 * Configuration for bulk operations
 */
const CV_BULK_OPERATIONS = Object.freeze({
  BATCH_SIZE: 10,
  OPERATIONS: Object.freeze(['archive', 'delete', 'publish']),
});

/**
 * CV Public URL Configuration
 * Base URL for public CV sharing
 */
const CV_PUBLIC_URL = Object.freeze({
  BASE_URL: 'https://cv-enhancer.com/cv',
  SHORT_ID_LENGTH: 8,
});

/**
 * CV Proficiency Levels
 * Standard proficiency levels for skills and languages
 */
const CV_PROFICIENCY_LEVELS = Object.freeze({
  SKILLS: Object.freeze(['beginner', 'intermediate', 'advanced', 'expert']),
  LANGUAGES: Object.freeze(['beginner', 'intermediate', 'advanced', 'native']),
});

/**
 * CV Sort Options
 * Available sorting options for CV lists
 */
const CV_SORT_OPTIONS = Object.freeze({
  FIELDS: Object.freeze(['createdAt', 'updatedAt', 'title', 'status']),
  ORDERS: Object.freeze(['asc', 'desc']),
  DEFAULT_FIELD: 'updatedAt',
  DEFAULT_ORDER: 'desc',
});

/**
 * CV Recommendations Configuration
 * Minimum requirements for CV quality recommendations
 */
const RECOMMENDATIONS = Object.freeze({
  /**
   * Minimum words for a good summary section
   * 50 words - ensures meaningful professional summary
   */
  SUMMARY_MIN_WORDS: 50,

  /**
   * Maximum words for a concise summary
   * 200 words - prevents overly long summaries
   */
  SUMMARY_MAX_WORDS: 200,

  /**
   * Minimum experience entries for completeness
   * 2 entries - shows career progression
   */
  EXPERIENCE_MIN_ENTRIES: 2,

  /**
   * Minimum skills count for skill diversity
   * 5 skills - demonstrates technical breadth
   */
  SKILLS_MIN_COUNT: 5,

  /**
   * Minimum education entries
   * 1 entry - basic requirement
   */
  EDUCATION_MIN_ENTRIES: 1,
});

/**
 * CV Optimizer Configuration
 * Weights and settings for CV optimization algorithms
 */
const OPTIMIZER_CONFIG = Object.freeze({
  /**
   * Weight for skills matching in optimization score
   * 0.3 (30%) - Skills are important but not the only factor
   */
  DEFAULT_WEIGHT_SKILLS: 0.3,

  /**
   * Weight for experience quality in optimization score
   * 0.2 (20%) - Experience relevance matters
   */
  DEFAULT_WEIGHT_EXPERIENCE: 0.2,

  /**
   * Weight for section completeness in optimization score
   * 0.4 (40%) - Complete sections are most important
   */
  DEFAULT_WEIGHT_SECTIONS: 0.4,

  /**
   * Days before cleaning up inactive optimizer data
   * 365 days (1 year) - long retention for analytics
   */
  INACTIVE_CLEANUP_DAYS: 365,
});

module.exports = {
  CV_SOURCE,
  CV_VERSION_CHANGE_TYPE,
  CV_VERSION_NAMES,
  CV_VERSION_DESCRIPTIONS,
  CV_CONTENT_SECTIONS,
  CV_SETTINGS_DEFAULTS,
  CV_SETTINGS_OPTIONS,
  CV_CONTENT_DEFAULTS,
  CV_BULK_OPERATIONS,
  CV_PUBLIC_URL,
  CV_PROFICIENCY_LEVELS,
  CV_SORT_OPTIONS,
  RECOMMENDATIONS,
  OPTIMIZER_CONFIG,
};

