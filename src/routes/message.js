'use string'

class Message {
  constructor() {
    this.prefix = '/message';
  }

  /**
   * Write new message
   */
  ['PUT: /:chat_id']() {
    return {
      description: 'Writing new message to certain chat',
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
      query: {
        chat_id: { type: 'string' }
      },
      res: {
        message: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            type: { type: 'string' },
            created_at: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      async h(req) {
        const { chat, body, user } = req;
        const userId = user._id;
        const data = { userId, chat, body };
        const message = await this.serviceMessage.create(data);

        const receivers = chat.members
          .filter(m => m.user_id !== userId)
          .map(m => m.user_id);

        const socketData = {
          message,
          receivers,
          author: user
        };
        this.serviceWebsocket.writeMessage(socketData);
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