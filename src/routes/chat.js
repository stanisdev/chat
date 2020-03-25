'use string'

const { pick } = require('lodash');

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * Get user's chats
   */
  ['GET: /']() {
    const limitConfig = this.config.chats.limit;
    return {
      description: 'Get list of user\'s chats',
      auth: true,
      query: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: limitConfig.max,
          default: limitConfig.default
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      res: {
        chats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'number' },
              name: { type: 'string' },
              last_message: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  type: { type: 'string' },
                  author_name: { type: 'string' },
                  created_at: { type: 'number' }
                }
              }
            }
          }
        }
      },
      async h(req) {
        const { page, limit } = req.query;
        const params = {
          userId: req.user._id,
          limit,
          page
        };
        const { chats, chatIds } = await this.serviceChat.getMany(params);

        /**
         * Get last message of each chat
         */
        let lastMessages = await this.db.Message.getLastMessages(chatIds);
        lastMessages = lastMessages.map(message => {
          message.created_at = new Date(message.created_at).getTime();
          return message;
        });

        /**
         * Set last message to apropriate chat
         */
        chats.forEach(chat => {
          const message = lastMessages.find(message => message.chat_id === chat.id);
          chat.last_message = message instanceof Object ? message : {};
        });
        return { ok: true, chats };
      }
    };
  }

  /**
   * Messages of specific chat
   */
  ['GET: /:chat_id']() {
    const limitConfig = this.config.messages.limit;
    return {
      auth: true,
      filters: ['chat.isMember'],
      description: 'Get list of messages of certain chat',
      params: {
        chat_id: { type: 'string', maxLength: 8 }
      },
      query: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: limitConfig.max,
          default: limitConfig.default
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      res: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' },
              is_read: { type: 'boolean' },
              created_at: { type: 'number' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  is_online: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      async h(req) {
        const { limit, page } = req.query;
        const params = {
          chatId: req.params.chat_id,
          limit,
          page
        }
        const messages = await this.serviceMessage.getMany(params);
        return { ok: true, messages };
      }
    };
  }

  /**
   * Create chat
   */
  ['PUT: /']() {
    return {
      description: 'Creating a new chat',
      auth: true,
      body: {
        type: {
          type: 'integer',
          enum: [0, 1]
        },
        members: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' }
        },
        Required: ['type', 'members']
      },
      res: {
        chat: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      },
      async h(req) {
        const chat = await this.serviceChat.create(req.user, req.body);
        return {
          ok: true,
          chat: pick(chat, ['id'])
        };
      }
    };
  }

  /**
   * Delete chat
   */
  ['DELETE: /:id']() {}
}

module.exports = Chat;