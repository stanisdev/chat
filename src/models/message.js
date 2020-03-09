'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');

const messageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  author_id: {
    type: String,
    ref: 'User',
    required: true
  },
  chat_id: {
    type: String,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text/plain', 'image/jpeg'],
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  statuses: [{
    recipient_id: {
      type: 'String',
      ref: 'User',
      required: true
    },
    /**
     * Value of message status belonging specific user
     * 0 - received to the server
     * 1 - has been read by user
     * 2 - deleted
     */
    value: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Message', messageSchema);