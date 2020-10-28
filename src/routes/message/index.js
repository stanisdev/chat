'use string'

class Message {
  constructor() {
    this.prefix = '/message';
  }

  /**
   * Write a message
   * @todo: Add restriction to write more than 20 messages per hour.
   */
  async ['POST /:chat_id | auth, chat.is-member']({
    body: { content, type },
    chat: { members, _id: chatId },
    user: author,
  }) {
    /**
     * Save message to database
     */
    const statuses = members.map(member => {
      const value = member.user_id === author._id ? 1 : 0;
      return {
        recipient_id: member.user_id,
        value
      };
    });
    const data = {
      author_id: author._id,
      chat_id: chatId,
      content,
      type,
      statuses
    };
    const message = new this.db.Message(data);
    await message.save();
    /**
     * Broadcast the message to the interlocutors
     */
    const receivers = [];
    for (let a = 0; a < members.length; a++) {
      const member = members[a];
      if (member.user_id !== author._id) {
        receivers.push(member.user_id);
      }
    }
    this.serviceWebsocket.writeMessage({ message, receivers, author });
    return message;
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
   * @todo: update the field "viewed"
   */
  async ['GET /:chat_id/:ids | auth, chat.is-member, maxIds'](req) {
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
  async ['DELETE /:chat_id/:ids | auth, chat.is-member'](req) {
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