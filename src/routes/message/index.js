'use string'

class Message {
  constructor() {
    this.prefix = '/message';
  }

  /**
   * Write new message
   */
  async ['POST /:chat_id | auth, isChatMember']({chat, body, user}) {
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

  /**
   * Edit message
   */
  async ['PUT /:id']() {
    return { ok: true };
  }

  /**
   * Update status of messages
   * @todo: define schema
   */
  async ['GET /:chat_id/:ids | auth, isChatMember, maxIds'](req) {
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

  /**
   * Delete messages
   * @todo: define schema
   */
  async ['DELETE /:chat_id/:ids | auth, isChatMember'](req) {
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
}

module.exports = Message;