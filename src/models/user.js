'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');
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
    const salt = nanoid(6);
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
    return this.count({ $or: ids });
  }
};

userSchema.methods = instanceMethods;
userSchema.statics = staticMethods;

module.exports = mongoose.model('User', userSchema);