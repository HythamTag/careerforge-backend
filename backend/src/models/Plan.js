/**
 * Plan model
 * Owner: Backend Leader
 */

const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  stripePlanId: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  features: [{
    type: String
  }],
  limits: {
    resumes: {
      type: Number,
      default: 5
    },
    atsChecks: {
      type: Number,
      default: 10
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
