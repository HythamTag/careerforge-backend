/**
 * CV VERSION MODEL
 *
 * Defines the data structure and schema for CV version operations.
 * Handles version control for CV documents.
 *
 * @module modules/cvs/models/cv-version.model
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { STRING_LIMITS, NUMERIC_LIMITS, CV_VERSION_CHANGE_TYPE } = require('@constants');

/**
 * CV Version Schema
 * Version control for CV documents
 * 
 * API Fields Mapping:
 * - versionNumber -> version (in API response)
 * - name -> name (version name)
 * - description -> description (version description)
 * - cvId -> cvId (in API response)
 * - userId -> createdBy (in API response)
 */
const CVVersionSchema = new Schema({
  cvId: {
    type: Schema.Types.ObjectId,
    ref: 'CV',
    required: true,
    index: true,
  },
  versionNumber: {
    type: Number,
    required: true,
    min: NUMERIC_LIMITS.MIN_VERSION_NUMBER,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
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
  content: {
    type: Schema.Types.Mixed,
    required: true,
  },
  changeType: {
    type: String,
    enum: Object.values(CV_VERSION_CHANGE_TYPE),
    default: CV_VERSION_CHANGE_TYPE.MANUAL,
  },
  metadata: {
    wordCount: Number,
    sectionCount: Number,
    aiConfidence: Number,
    processingTime: Number,
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'cv_versions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for consistent API responses
CVVersionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for version control
CVVersionSchema.index({ cvId: 1, versionNumber: 1 }, { unique: true });
CVVersionSchema.index({ cvId: 1, createdAt: -1 });
CVVersionSchema.index({ userId: 1, createdAt: -1 });
CVVersionSchema.index({ cvId: 1, isActive: 1 });

// Create model
const CVVersion = mongoose.model('CVVersion', CVVersionSchema);

module.exports = {
  CVVersion,
};

