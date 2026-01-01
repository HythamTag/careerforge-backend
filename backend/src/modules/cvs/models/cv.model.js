/**
 * CV MODEL
 *
 * Defines the data structures and schemas for CV operations.
 * Includes CV documents and metadata management.
 *
 * @module modules/cvs/models/cv.model
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { STRING_LIMITS, NUMERIC_LIMITS, CV_ENTITY_STATUS, CV_STATUS, CV_SOURCE, CV_SETTINGS_DEFAULTS } = require('@constants');
const { TEMPLATES } = require('@constants');

/**
 * CV Schema
 * Main CV document structure
 */
const CVSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: STRING_LIMITS.TITLE_MAX_LENGTH,
  },
  description: {
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.DESCRIPTION_MAX_LENGTH,
  },
  status: {
    type: String,
    enum: Object.values(CV_ENTITY_STATUS),
    default: CV_ENTITY_STATUS.DRAFT,
    index: true,
  },
  source: {
    type: String,
    enum: Object.values(CV_SOURCE),
    default: CV_SOURCE.MANUAL,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: STRING_LIMITS.TAG_MAX_LENGTH,
  }],
  content: {
    type: Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    // File information (for uploaded CVs)
    filePath: String,
    originalFilename: String,
    fileSize: Number,
    mimeType: String,
    s3Key: String,
    uploadedAt: Date,
    // Statistics
    wordCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    sectionCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    viewCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    downloadCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    shareCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    favoriteCount: { type: Number, default: NUMERIC_LIMITS.DEFAULT_COUNT },
    isPublic: { type: Boolean, default: false },
    publicUrl: String,
    seoKeywords: [String],
  },
  template: {
    type: String,
    enum: Object.keys(TEMPLATES),
    default: 'modern',
    required: true,
    index: true,
  },
  settings: {
    theme: { type: String, default: CV_SETTINGS_DEFAULTS.THEME },
    language: { type: String, default: CV_SETTINGS_DEFAULTS.LANGUAGE },
    fontSize: { type: String, default: CV_SETTINGS_DEFAULTS.FONT_SIZE },
    pageFormat: { type: String, default: CV_SETTINGS_DEFAULTS.PAGE_FORMAT },
    margins: { type: String, default: CV_SETTINGS_DEFAULTS.MARGINS },
  },
  // Parsing workflow fields
  parsingStatus: {
    type: String,
    enum: Object.values(CV_STATUS),
    default: CV_STATUS.PENDING,
    index: true,
  },
  isParsed: { type: Boolean, default: false },
  parsedAt: Date,
  parsedContent: Schema.Types.Mixed, // Stores raw AI-parsed content
  parsingMetadata: {
    fileType: String,
    parsingVersion: String,
    confidence: Number,
    sectionsFound: Number,
  },
  parsingError: String,
  failedAt: Date,
  parsingProgress: { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'cvs',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for consistent API responses
CVSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Indexes for performance
CVSchema.index({ userId: 1, status: 1, createdAt: -1 });
CVSchema.index({ userId: 1, title: 1 });
CVSchema.index({ userId: 1, template: 1 });
CVSchema.index({ tags: 1 });
CVSchema.index({ 'metadata.isPublic': 1, createdAt: -1 });
CVSchema.index({ 'metadata.publicUrl': 1 }, { sparse: true });

// Text index for search functionality
CVSchema.index({ title: 'text', description: 'text' });

// Create model
const CV = mongoose.model('CV', CVSchema);

module.exports = {
  CV,
};

