'use string'

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
   * Add new message
   */
  ['POST: /:id']() {}

  /**
   * Create chat
   */
  ['PUT: /']() {}

  /**
   * Delete chat
   */
  ['DELETE: /:id']() {}
}

module.exports = Chat;