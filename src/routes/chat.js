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
          maximum: limitConfig.max
        },
        page: { type: 'integer', minimum: 0 }
      },
      res: {
        chats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'number' },
              last_message: {
                type: 'object',
                properties: {} // @todo: describe schema
              }
            }
          }
        }
      },
      async h(req) {
        const { query } = req;
        let limit = limitConfig.default;
        let page = 1;
        if (Number.isInteger(query.limit)) {
          limit = query.limit;
        }
        if (Number.isInteger(query.page)) {
          page = query.page;
        }
        const chats = await this.serviceChat.getMany(req.user._id, { limit, page });
        return {
          ok: true,
          chats: chats.map(chat => {
            return pick(chat, ['id', 'type']);
          })
        };
      }
    };
  }

  /**
   * Messages of specific chat
   */
  ['GET: /:id']() {
    return {
      description: 'Get list of messages of certain chat (@hint: this endpoint is not finished yet)',
      params: {
        id: { type: 'string', maxLength: 8 }
      },
      query: {
        limit: { type: 'integer', minimum: 1 },
        page: { type: 'integer', minimum: 0 },
        Required: ['limit']
      },
      res: {
        messages: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      async h(req) {
        return { ok: true, messages: ['one', 'two', 'three'] };
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