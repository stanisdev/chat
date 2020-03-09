'use string'

const { pick } = require('lodash');

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * All user's chats
   */
  ['GET: /']() {
    return {
      auth: true,
      async h(req) {
        // req.user
        return { ok: true };
      }
    };
  }

  /**
   * Messages of specific chat
   */
  ['GET: /:id']() {
    return {
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