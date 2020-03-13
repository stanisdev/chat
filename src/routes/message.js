'use string'

class Message {
  constructor() {
    this.prefix = '/message';
  }

  /**
   * Add new message
   */
  ['POST: /:chat_id']() {
    return {
      description: 'Adding new message to certain chat',
      auth: true,
      filters: ['chat.isMember'],
      body: {
        content: { type: 'string' },
        type: {
          type: 'string',
          enum: ['text/plain', 'image/jpeg']
        },
        Required: ['content', 'type']
      },
      res: {
        message: {
          type: 'object',
          properties: {
            author_id: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' }
          }
        }
      },
      async h(req) {
        const data = {
          chat: req.chat,
          userId: req.user._id,
          body: req.body
        };
        const message = await this.serviceMessage.create(data);
        return { ok: true, message };
      }
    };
  }

  /**
   * Edit message
   */
  ['POST: /:id']() {}

  /**
   * Update status of messages
   */
  ['GET: /:ids']() {}
}

module.exports = Message;