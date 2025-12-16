/**
 * Base Repository Class
 * Owner: Backend Leader
 * Provides common database operations
 */

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw error;
    }
  }

  async findById(id, populate = []) {
    try {
      let query = this.model.findById(id);
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      return await query;
    } catch (error) {
      throw error;
    }
  }

  async findOne(conditions, populate = []) {
    try {
      let query = this.model.findOne(conditions);
      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }
      return await query;
    } catch (error) {
      throw error;
    }
  }

  async find(conditions = {}, options = {}) {
    try {
      const {
        populate = [],
        sort = {},
        limit,
        skip = 0,
        select
      } = options;

      let query = this.model.find(conditions);

      if (populate.length > 0) {
        populate.forEach(field => {
          query = query.populate(field);
        });
      }

      if (Object.keys(sort).length > 0) {
        query = query.sort(sort);
      }

      if (limit) {
        query = query.limit(limit);
      }

      if (skip > 0) {
        query = query.skip(skip);
      }

      if (select) {
        query = query.select(select);
      }

      return await query;
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, data) {
    try {
      return await this.model.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async count(conditions = {}) {
    try {
      return await this.model.countDocuments(conditions);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BaseRepository;
