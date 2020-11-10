'use string'

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const paginate = require('../../plugins/mongoosePaginate');

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
    type: Boolean
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
  members: [memberSchema],
  /**
   * For group chats
   */
  name: String
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
    members = members.map(member => ({
      'members.user_id': member
    }));
    return this.findOne({
      type: 0,
      $and: members
    });
  },

  createNew({ members, users, isDialog, owner, type }) {
    members = members.map(memberId => {
      const user = users.find(user => user._id === memberId);
      const result = {
        user_id: memberId,
        name: user.name
      };

      if (isDialog) {
        result.is_deleted = false;
        return result;
      }
      result.status = memberId === owner._id ? 1 : 0;
      return result;
    });
    const chat = new this({ type, members });
    return chat.save();
  },

  findAllByMemberId(userId) {
    return this.find({
      'members.user_id': userId
    }, '_id');
  },

  removeOneById(id) {
    return Promise.all([
      this.deleteOne(
        { _id: id }
      ),
      mongoose.model('Message').deleteMany({
        chat_id: id
      })
    ]);
  },

  /**
   * Add one or more new members to a chat
   */
  addMembers({ adminId, chatId, users, recipients }) {
    const members = [];
    const tasks = [];
    const statuses = recipients.map(userId => {
      return {
        recipient_id: userId,
        value: 0
      };
    });

    for (let a = 0; a < users.length; a++) {
      const user = users[a];
      members.push({
        user_id: user._id,
        name: user.name,
        status: 0
      });

      /**
       * This system message logs a fact of
       * members being added
       */
      const message = new mongoose.model('Message')({
        author_id: adminId,
        chat_id: chatId,
        content: 'user-added-to-chat',
        type: 'system/message',
        statuses,
        metadata: {
          user_id: user._id,
        }
      });
      tasks.push(message.save());
    }
    /**
     * Update the field "members" of a chat.
     */
    tasks.push(
      this.updateOne(
        { _id: chatId },
        {
          $push: {
            members: {
              $each: members
            }
          }
        }
      )
    );
    return Promise.all(tasks);
  },

  setMemberAsDeleted(chatId, userId) {
    return this.updateOne(
      { 
        _id: chatId,
        'members.user_id': userId
      },
      { $set:
        { 'members.$.is_deleted': true }
      }
   );
  },

  removeMember(chatId, userId, recipients) {
    const statuses = recipients.map(id => {
      return {
        recipient_id: id
      };
    });
    const message = new mongoose.model('Message')({
      author_id: userId,
      chat_id: chatId,
      content: 'user-left-chat',
      type: 'system/message',
      statuses
    });
    return Promise.all([
      message.save(),
      this.updateOne(
        { _id: chatId },
        { $pull:
          { 'members': { user_id: userId } }
        }
      )
    ]);
  },

  getLastMessages(ids) {
    return mongoose.model('Message').aggregate([
      {
        $match: {
          chat_id: { $in: ids },
          type: { $ne: 'system/message' }
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $group: {
          _id: '$chat_id',
          content: { $first: '$content' },
          type: { $first: '$type' },
          author_id: { $first: '$author_id' },
          chat_id: { $first: '$chat_id' },
          viewed: { $first: '$viewed' },
          created_at: { $first: '$created_at' },
          statuses: { $first: '$statuses' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      }
    ]);
  },

  getUnreadMessages(chatIds, userId) {
    return mongoose.model('Message').aggregate([
      {
        $match: {
          chat_id: { $in: chatIds },
          type: { $ne: 'system/message' },
          statuses: {
            $elemMatch: { recipient_id: userId, value: 0 }
          }
        }
      },
      {
        $group: {
          _id: '$chat_id',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          chat_id: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
  }
};

chatSchema.statics = staticMethods;
chatSchema.methods = instanceMethods;
chatSchema.plugin(paginate);

module.exports = mongoose.model('Chat', chatSchema);