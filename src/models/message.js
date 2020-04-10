'use string'

const mongoose = require('mongoose');
const nanoid = require('nanoid');
const paginate = require('../plugins/mongoosePaginate');

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
    required: true,
    // index: true // @todo: uncomment this
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
  statuses: [{
    _id: false,
    recipient_id: {
      type: 'String',
      ref: 'User',
      required: true,
      // index: true // @todo: uncomment this
    },
    /**
     * Value of message status belonging specific user
     * 0 - received to the server
     * 1 - has been read by user
     * 2 - deleted
     */
    value: {
      type: Number,
      default: 0,
      min: 0,
      max: 2
    }
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const staticMethods = {
  getLastMessages({ userId, allChatsIds, limit, page }) {
    const skip = limit * (page - 1);

    return this.aggregate([
      { $match: {
          'statuses.recipient_id': userId,
          chat_id: { $in: allChatsIds }
        }
      },
      { $sort: { created_at: -1 } },
      { $group: {
          _id: '$chat_id',
          content: { $first: '$content' },
          type: { $first: '$type' },
          author_id: { $first: '$author_id' },
          chat_id: { $first: '$chat_id' },
          created_at: { $first: '$created_at' },
          statuses: { $first: '$statuses' }
        }
      },
      { $sort: { created_at: -1 } },
      { $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $lookup: {
          from: 'chats',
          localField: 'chat_id',
          foreignField: '_id',
          as: 'chat'
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
  },

  async countUnread(chatsIds, userId) {
    const tasks = chatsIds.map(chatId => {
      return this.countDocuments({
        chat_id: chatId,
        statuses: {
          $elemMatch: {
            recipient_id: userId,
            value: 0
          }
        }
      });
    });
    const data = await Promise.all(tasks);
    return data.map((count, index) => {
      return { count, chatId: chatsIds[index] };
    });
  },

  findByStatuses({ ids, chatId, userId }) {
    return this.find({
      _id: {
        $in: ids
      },
      chat_id: chatId,
      statuses: {
        $elemMatch: {
          recipient_id: userId,
          value: 0
        }
      }
    });
  }
};

messageSchema.statics = staticMethods;
messageSchema.plugin(paginate);

module.exports = mongoose.model('Message', messageSchema);