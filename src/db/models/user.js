'use string'

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const { nanoid: nanoidAsync } = require('nanoid/async');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  email: {
    type: String,
    // unique: true, // @todo: uncomment this
    lowercase: true,
    trim: true,
    minlength: 6,
    maxlength: 50,
    required: true
  },
  /**
   * 1 - user confirmed email
   * 0 - email not confirmed
   * -1 - user is banned
   */
  status: {
    type: Number,
    default: 0,
    min: -1,
    max: 1
  },
  /**
   * This field is used to confirm email
   * or reset password
   */
  code: {
    value: {
      type: String,
      maxlength: 40
    },
    ttl: {
      type: Date
    }
  },
  name: {
    type: String,
    minlength: 1,
    maxlength: 60,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const instanceMethods = {
  async cryptPassword() {
    const salt = await nanoidAsync(6);
    this.salt = salt;
    this.password = await bcrypt.hash(this.password + salt, 10);
  },

  checkPassword(password) {
    return bcrypt.compare(password + this.salt, this.password);
  }
};

const staticMethods = {
  countByIds(ids) {
    ids = ids.map(id => {
      return { _id: id };
    });
    return this.countDocuments({ $or: ids });
  },
  findByManyId(ids) {
    return this.find({
      _id: { $in: ids }
    }, '_id name');
  }
};

userSchema.methods = instanceMethods;
userSchema.statics = staticMethods;

module.exports = mongoose.model('User', userSchema);