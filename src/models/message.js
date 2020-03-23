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
    _id: false,
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
  getLastMessages(chatIds) {
    return this.aggregate([
      { $match: {
          chat_id: { $in: chatIds }
        }
      },
      { $sort: { created_at: -1 } },
      { $group: {
          _id: '$chat_id',
          author_id: { $first: '$author_id' },
          content: { $first: '$content' },
          type: { $first: '$type' },
          chat_id: { $first: '$chat_id' },
        }
      },
      { $lookup: {
          from: 'users',
          localField: 'author_id',
          foreignField: '_id',
          as: 'users'
        }
      },
      { $project: {
          _id: 0,
          content: 1,
          type: 1,
          chat_id: 1,
          'author_name': { $arrayElemAt: [ "$users.name", 0 ] },
          'created_at':  { $arrayElemAt: [ "$users.created_at", 0 ] }
        }
      }
    ]);
  }
};

messageSchema.statics = staticMethods;
messageSchema.plugin(paginate);

module.exports = mongoose.model('Message', messageSchema);