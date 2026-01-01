/**
 * BullMQ v5 Helper - Ensures job data is properly serialized
 * BullMQ v5 is very strict about data types - all values must be strings or numbers
 */

function sanitizeJobData(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
    } else if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (typeof value === 'number') {
      sanitized[key] = String(value);
    } else if (typeof value === 'boolean') {
      sanitized[key] = String(value);
    } else {
      // For any other type, convert to string
      sanitized[key] = String(value);
    }
  }
  
  return sanitized;
}

function sanitizeJobId(jobId) {
  // Ensure jobId is a string with no special characters that might cause issues
  return String(jobId).replace(/[^a-zA-Z0-9\-_]/g, '-');
}

module.exports = {
  sanitizeJobData,
  sanitizeJobId,
};

