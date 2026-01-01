/**
 * ============================================================================
 * ats.constants.js - ATS Scoring Constants (Pure Static)
 * ============================================================================
 */

const ATS_SCORING_WEIGHTS = Object.freeze({
  STRUCTURE: 40,
  SKILLS_VISIBILITY: 25,
  EXPERIENCE_QUALITY: 25,
  FORMATTING_SAFETY: 10,
});

const ATS_REQUIRED_SECTIONS = Object.freeze([
  'summary',
  'experience',
  'education',
  'skills',
]);

const ATS_OPTIONAL_SECTIONS = Object.freeze([
  'projects',
  'certifications',
  'publications',
  'awards',
  'languages',
  'volunteer',
]);

const ATS_THRESHOLDS = Object.freeze({
  MIN_BULLETS_PER_ROLE: 3,
  MIN_TECHNICAL_SKILLS: 5,
  MIN_EXPERIENCE_ENTRIES: 2,
  MIN_EDUCATION_ENTRIES: 1,
  MIN_SUMMARY_WORDS: 50,
  MAX_SUMMARY_WORDS: 200,
  DEFAULT_CONFIDENCE_THRESHOLD: 70,
});

const ATS_TECHNICAL_KEYWORDS = Object.freeze([
  'javascript', 'typescript', 'python', 'java', 'c++',
  'react', 'node.js', 'angular', 'vue', 'docker',
  'kubernetes', 'aws', 'azure', 'gcp', 'sql',
  'mongodb', 'postgresql', 'redis', 'git',
  'ci/cd', 'rest', 'graphql', 'microservices',
  'agile', 'scrum', 'machine learning', 'ai',
]);

const ATS_ACTION_VERBS = Object.freeze([
  'achieved', 'architected', 'automated', 'built',
  'collaborated', 'created', 'delivered', 'deployed',
  'designed', 'developed', 'enhanced', 'implemented',
  'improved', 'increased', 'integrated', 'launched',
  'led', 'maintained', 'managed', 'mentored',
  'migrated', 'optimized', 'reduced', 'streamlined',
]);

/**
 * CV ATS Analysis Configuration
 * Settings for ATS (Applicant Tracking System) analysis
 */
const CV_ATS_CONFIG = Object.freeze({
  /**
   * Maximum number of analyses to process in batch
   * 100 - prevents memory issues with large batches
   */
  MAX_ANALYSIS_LIMIT: 100,

  /**
   * Default number of top suggestions to return
   * 5 suggestions - manageable for user review
   */
  DEFAULT_TOP_SUGGESTIONS_LIMIT: 5,

  /**
   * Default time frame for analysis data
   * '30d' - 30 days of historical data
   */
  DEFAULT_TIMEFRAME: '30d',

  /**
   * Number of analysis steps per analysis type
   * Higher number = more thorough analysis
   */
  ANALYSIS_STEPS: Object.freeze({
    COMPATIBILITY: 3,
    KEYWORD_ANALYSIS: 2,
    FORMAT_CHECK: 1,
    COMPREHENSIVE: 5,
  }),

  /**
   * Estimated processing time per analysis type (seconds)
   * Used for progress estimation and timeout calculations
   */
  ANALYSIS_TIME_SECONDS: Object.freeze({
    COMPATIBILITY: 15,
    KEYWORD_ANALYSIS: 10,
    FORMAT_CHECK: 5,
    COMPREHENSIVE: 25,
  }),

  /**
   * Divisor for calculating top suggestions from total
   * 10 - returns top 10% of suggestions
   */
  DEFAULT_TOP_SUGGESTIONS_DIVISOR: 10,
});

module.exports = {
  ATS_SCORING_WEIGHTS,
  ATS_REQUIRED_SECTIONS,
  ATS_OPTIONAL_SECTIONS,
  ATS_THRESHOLDS,
  ATS_TECHNICAL_KEYWORDS,
  ATS_ACTION_VERBS,
  CV_ATS_CONFIG,
};
