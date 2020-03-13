'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');
const paginate = require('../plugins/mongoosePaginate');

const memberSchema = new mongoose.Schema({
  _id: false,
  user_id: {
    type: String,
    ref: 'User',
    required: true
  },
  /**
   * 0 - common member, 1 - owner
   * For a dialog does not need set status
   */
  status: {
    type: Number
  },
  /**
   * User can delete chat from own list of chats.
   * Despite that another interlocutor may to continue dialog.
   * So first user should be related to the chat until interlocutor to be blocked.
   */
  is_deleted: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  _id: {
    type: String,
    default() {
      return nanoid(8);
    }
  },
  type: {
    type: Number,
    default: 0 // 0 - dialog, 1 - group
  },
  members: [memberSchema]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const staticMethods = {
  findDialog(members) {
    members = members.map(member => {
      return { 'members.user_id': member };
    });
    return this.findOne({
      type: 0,
      $and: members
    });
  }
};

chatSchema.statics = staticMethods;
chatSchema.plugin(paginate);

module.exports = mongoose.model('Chat', chatSchema);