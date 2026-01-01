/**
 * CV PARSING MODEL
 *
 * Defines the data structures and schemas for CV parsing operations.
 * Includes parsing jobs, results, and metadata management.
 *
 * @module modules/cv-parsing/models/cv-parsing.model
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { NUMERIC_LIMITS, JOB_LIMITS, ATS_THRESHOLDS, JOB_STATUS, OUTPUT_FORMAT, JOB_PRIORITY_NAMES, JOB_PRIORITY } = require('@constants');

/**
 * CV Parsing Job Schema
 * Tracks parsing job status and metadata
 */
const CVParsingJobSchema = new Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
  },
  backgroundJobId: {
    type: String,
    default: null,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  cvId: {
    type: Schema.Types.ObjectId,
    ref: 'CV',
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileType: {
    type: String,
    enum: [OUTPUT_FORMAT.PDF, OUTPUT_FORMAT.DOCX, 'doc'], // 'doc' is legacy format
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.PENDING,
    index: true,
  },
  progress: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
    min: NUMERIC_LIMITS.PROGRESS_MIN,
    max: NUMERIC_LIMITS.PROGRESS_MAX,
  },
  priority: {
    type: String,
    enum: Object.values(JOB_PRIORITY_NAMES),
    default: JOB_PRIORITY_NAMES[JOB_PRIORITY.NORMAL],
  },
  parsingOptions: {
    extractSkills: { type: Boolean, default: true },
    extractExperience: { type: Boolean, default: true },
    extractEducation: { type: Boolean, default: true },
    extractProjects: { type: Boolean, default: true },
    extractCertifications: { type: Boolean, default: true },
    extractLanguages: { type: Boolean, default: true },
    extractPublications: { type: Boolean, default: true },
  },
  result: {
    parsedContent: {
      personal: {
        name: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        website: String,
        summary: String,
      },
      experience: [{
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String,
        technologies: [String],
        achievements: [String],
      }],
      education: [{
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
        gpa: String,
        honors: [String],
      }],
      skills: [{
        category: String,
        skills: [String],
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
      }],
      projects: [{
        name: String,
        description: String,
        technologies: [String],
        startDate: String,
        endDate: String,
        url: String,
        urlLabel: String,
      }],
      certifications: [{
        name: String,
        issuer: String,
        date: String,
        url: String,
        urlLabel: String,
        credentialId: String,
      }],
      languages: [{
        name: String,
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'native'],
        },
      }],
      publications: [{
        title: String,
        authors: [String],
        journal: String,
        date: String,
        doi: String,
        url: String,
        urlLabel: String,
      }],
    },
    confidence: {
      type: Number,
      min: NUMERIC_LIMITS.SCORE_MIN,
      max: NUMERIC_LIMITS.SCORE_MAX,
    },
    processingTime: Number,
    pagesProcessed: Number,
    sectionsFound: [String],
  },
  error: {
    message: String,
    code: String,
    details: Schema.Types.Mixed,
  },
  metadata: {
    parserVersion: String,
    aiModel: String,
    processingStartTime: Date,
    processingEndTime: Date,
    retryCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    maxRetries: { type: Number, default: JOB_LIMITS.DEFAULT_RETRIES },
  },
}, {
  timestamps: true,
  collection: 'cv_parsing_jobs',
});

// Indexes for performance
CVParsingJobSchema.index({ userId: 1, createdAt: -1 });
CVParsingJobSchema.index({ status: 1, createdAt: -1 });
CVParsingJobSchema.index({ 'metadata.processingStartTime': 1 });
// Note: jobId index is created automatically by unique: true in field definition

/**
 * CV Parsing Statistics Schema
 * Aggregated statistics for parsing operations
 */
const CVParsingStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalParsings: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  successfulParsings: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  failedParsings: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  averageConfidence: {
    type: Number,
    min: NUMERIC_LIMITS.SCORE_MIN,
    max: NUMERIC_LIMITS.SCORE_MAX,
    default: NUMERIC_LIMITS.DEFAULT_COUNT,
  },
  averageProcessingTime: {
    type: Number,
    default: NUMERIC_LIMITS.DEFAULT_COUNT, // in milliseconds
  },
  parsingByFileType: {
    pdf: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    docx: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    doc: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
  },
  lastParsingDate: Date,
  favoriteParserOptions: {
    extractSkills: { type: Boolean, default: true },
    extractExperience: { type: Boolean, default: true },
    extractEducation: { type: Boolean, default: true },
    extractProjects: { type: Boolean, default: true },
    extractCertifications: { type: Boolean, default: true },
    extractLanguages: { type: Boolean, default: true },
    extractPublications: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
  collection: 'cv_parsing_stats',
});

/**
 * Parser Configuration Schema
 * Stores parser-specific configurations and settings
 */
const ParserConfigSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'docx', 'unified'],
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  supportedFormats: [{
    type: String,
    enum: [OUTPUT_FORMAT.PDF, OUTPUT_FORMAT.DOCX, 'doc'], // 'doc' is legacy format
  }],
  configuration: {
    aiModel: String,
    maxFileSize: Number, // in bytes
    timeout: Number, // in milliseconds
    maxRetries: { type: Number, default: JOB_LIMITS.DEFAULT_RETRIES },
    confidenceThreshold: { type: Number, min: NUMERIC_LIMITS.SCORE_MIN, max: NUMERIC_LIMITS.SCORE_MAX, default: ATS_THRESHOLDS.DEFAULT_CONFIDENCE_THRESHOLD },
  },
  metadata: {
    author: String,
    description: String,
    createdBy: String,
    lastUpdatedBy: String,
  },
}, {
  timestamps: true,
  collection: 'parser_configs',
});

// Create models
const CVParsingJob = mongoose.model('CVParsingJob', CVParsingJobSchema);
const CVParsingStats = mongoose.model('CVParsingStats', CVParsingStatsSchema);
const ParserConfig = mongoose.model('ParserConfig', ParserConfigSchema);

module.exports = {
  CVParsingJob,
  CVParsingStats,
  ParserConfig,
};

