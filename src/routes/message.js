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
        this.serviceWebsocket.writeMessage(socketData); // @todo: rewrite this
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
  ['GET: /:chat_id/:ids']() {
    return {
      description: 'Updating statuses of one and more messages (mark messages as read)',
      auth: true,
      filters: ['chat.isMember', 'restriction.maxIds'],
      async h(req) {
        const userId = req.user._id;
        const params = {
          ids: req.params.ids,
          chatId: req.chat._id,
          userId
        };
        const messages = await this.db.Message.findByStatuses(params);
        if (messages.length !== req.params.ids.length) {
          throw this.Boom.badRequest({
            ids: 'The list of ids contains at least one incorrect value'
          });
        }
        await this.serviceMessage.updateStatuses(messages, userId);
        const receiversIds = req.chat.getOtherMembers(userId);

        const payload = {
          chat_id: req.chat._id,
          event: 'update/message.status',
          ids: req.params.ids
        };
        this.serviceWebsocket.sendAll(receiversIds, payload);
        return { ok: true };
      }
    };
  }

  /**
   * Delete messages
   */
  ['DELETE: /:chat_id/:ids']() {
    return {
      description: 'Deleting a message',
      auth: true,
      filters: ['chat.isMember'],
      async h(req) {
        let { ids, chat_id: chatId } = req.params;
        try {
          ids = ids.split(',');
          const params = {
            ids,
            chatId,
            userId: req.user._id
          };
          await this.serviceMessage.deleteMany(params);
        } catch {
          throw this.Boom.badRequest({
            ids: 'List of ids is incorrect'
          });
        }
        await this.serviceMessage.deleteWithEmptyStatuses(ids);
        const receivers = req.chat.getOtherMembers(req.user._id);
        const payload = {
          chat_id: chatId,
          event: 'delete/message',
          ids
        };
        this.serviceWebsocket.sendAll(receivers, payload);
        return { ok: true };
      }
    };
  }
}

module.exports = Message;