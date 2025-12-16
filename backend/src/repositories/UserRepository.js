/**
 * User Repository
 * Owner: Auth Developer
 */

const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByIdWithProfile(id) {
    return await this.findById(id);
  }

  async updateVerificationStatus(userId, isVerified) {
    return await this.updateById(userId, { isVerified });
  }
}

module.exports = new UserRepository();
