'use string'

const { Schema } = require('mongoose');
const nanoid = require('nanoid');

const chatSchema = new Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  type: {
    type: Number,
    default: 0 // 0 - dialog, 1 - group
  }
});

module.exports = chatSchema;