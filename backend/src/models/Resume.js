/**
 * Resume model
 * Owner: Resume Developer
 */

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  parsedData: {
    text: String,
    pages: Number,
    sections: mongoose.Schema.Types.Mixed
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100
  },
  atsSuggestions: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
