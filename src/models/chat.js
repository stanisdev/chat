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
   * To avoid additional, excessive queries when
   * list of chats are extracted
   */
  name: {
    type: String,
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

const instanceMethods = {
  getOtherMembers(userId) {
    return this.members
      .filter(m => m.user_id !== userId)
      .map(m => m.user_id);
  }
};

const staticMethods = {
  findDialog(members) {
    members = members.map(member => {
      return { 'members.user_id': member };
    });
    return this.findOne({
      type: 0,
      $and: members
    });
  },

  findAllByMemberId(userId) {
    return this.find({
      'members.user_id': userId
    }, '_id');
  },

  removeOneById(id) {
    return this.remove(
      { _id: id },
      { justOne: true }
    );
  }
};

chatSchema.statics = staticMethods;
chatSchema.methods = instanceMethods;
chatSchema.plugin(paginate);

module.exports = mongoose.model('Chat', chatSchema);