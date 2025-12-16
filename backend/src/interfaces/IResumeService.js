/**
 * Resume Service Interface
 * Owner: Resume Developer
 * Defines the contract for resume services
 */

class IResumeService {
  // Resume operations
  async createResume(userId, fileData) {
    throw new Error('Method not implemented');
  }

  async getResume(resumeId) {
    throw new Error('Method not implemented');
  }

  async updateResume(resumeId, data) {
    throw new Error('Method not implemented');
  }

  async deleteResume(resumeId) {
    throw new Error('Method not implemented');
  }

  async listUserResumes(userId, pagination) {
    throw new Error('Method not implemented');
  }

  // File operations
  async uploadFile(file) {
    throw new Error('Method not implemented');
  }

  async deleteFile(fileKey) {
    throw new Error('Method not implemented');
  }

  // Parsing operations
  async parseResume(fileBuffer) {
    throw new Error('Method not implemented');
  }
}

module.exports = IResumeService;
