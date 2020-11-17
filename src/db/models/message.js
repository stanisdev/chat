'use string'

const { Schema, model } = require('mongoose');
const { nanoid } = require('nanoid');

const messageSchema = new Schema({
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
    enum: [
      'text/plain',
      'image/jpeg',
      'system/message'
    ],
    required: true
  },
  /**
   * This field is intended to store data
   * related to the messages of system type.
   */
  metadata: {
    type: Schema.Types.Mixed
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
     * Message statuses related to a user
     * 0 - received by the server
     * 1 - has been read by a user
     * 2 - deleted
     */
    value: {
      type: Number,
      default: 0,
      min: 0,
      max: 2
    }
  }],
  /**
   * The flag is used to show whether a message
   * has been eventually viewed or not.
   */
  viewed: Boolean
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const staticMethods = {
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
  },

  findManyByCriteria({
    chatId,
    userId,
    limit,
    page
  }) {
    return this.findAndPaginate({
      query: {
        chat_id: chatId,
        'statuses.recipient_id': userId
      },
      sort: { created_at: -1 },
      select: '_id content type statuses author_id viewed metadata created_at',
      limit,
      page
    });
  }
};

messageSchema.statics = staticMethods;

module.exports = messageSchema;