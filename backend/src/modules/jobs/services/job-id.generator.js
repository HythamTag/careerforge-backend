/**
 * JOB ID GENERATOR
 * 
 * Generates unique identifiers for jobs.
 */

const crypto = require('crypto');

class JobIdGenerator {
  generate(type, userId = null) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const prefix = type.replace(/_/g, '').toLowerCase().slice(0, 10);
    const userPart = userId ? `_${userId.toString().slice(-4)}` : '';

    return `${prefix}_${timestamp}_${random}${userPart}`;
  }
}

module.exports = JobIdGenerator;
