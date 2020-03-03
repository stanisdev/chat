'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');

const memberSchema = new mongoose.Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  chat_id: {
    type: String,
    ref: 'Chat',
    required: true
  },
  user_id: {
    type: String,
    ref: 'User',
    required: true
  },
  status: {
    type: Number,
    default: 0 // 0 - common member, 1 - owner
  },
  /**
   * User can to delete chat from own list of chats.
   * Despite that another interlocutor may to continue dialog.
   * So first user should be related to the chat until interlocutor to be blocked.
   */
  is_deleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Member', memberSchema);