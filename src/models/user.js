'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 6,
    maxlength: 50,
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
  name: {
    type: String,
    minlength: 1,
    maxlength: 60,
    required: true
  },
  avatar: {
    type: String,
    maxlength: 200
  }
});

module.exports = mongoose.model('User', userSchema);