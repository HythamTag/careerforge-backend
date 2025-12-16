/**
 * Resume Repository
 * Owner: Resume Developer
 */

const BaseRepository = require('./BaseRepository');
const Resume = require('../models/Resume');

class ResumeRepository extends BaseRepository {
  constructor() {
    super(Resume);
  }

  async findByUserId(userId, options = {}) {
    return await this.find({ userId }, options);
  }

  async findByUserIdWithPagination(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await this.find(
      { userId },
      {
        sort: { createdAt: -1 },
        limit,
        skip,
        populate: []
      }
    );
  }

  async updateParsedData(resumeId, parsedData) {
    return await this.updateById(resumeId, { parsedData, status: 'completed' });
  }
}

module.exports = new ResumeRepository();
