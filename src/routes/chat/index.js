'use string'

const { pick } = require('lodash');

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * Get user's chats
   */
  async ['GET / | auth'](req) {
    const { limit, page } = req.query;
    const userId = req.user._id;

    /**
     * The parameter "allChatsIds" is used to avoid displaying
     * a chat where user wrote the message(s) and later left the chat.
     */
    const allChatsIds = await this.db.Chat.findAllByMemberId(userId);
    const lastMessages = await this.db.Message.getLastMessages({
      userId,
      allChatsIds: allChatsIds.map(c => c._id),
      limit,
      page
    });

    const interlocutors = [];
    const unreadChats = [];
    const chats = lastMessages.map(m => {
      const [chat] = m.chat;
      const [author] = m.author;
      let name = 'Not specified';
      if (chat.type === 1) {
        name = `Group chat, ${chat.members.length} members`;
      }
      else if (chat.type === 0) {
        const uId = chat.members.find(m => m.user_id !== userId).user_id;
        interlocutors.push(uId);
        name = uId; // This id will be removed by user's name
      }
      /**
       * Determine at least 1 unread message
       */
      const status = m.statuses.find(s => s.recipient_id === userId);
      if (status instanceof Object && status.value === 0) {
        unreadChats.push(chat._id);
      }
      return {
        id: chat._id,
        type: chat.type,
        name,
        unread_messages: 0,
        last_message: {
          content: m.content,
          type: m.type,
          created_at: new Date(m.created_at).getTime(),
          author: {
            name: author.name
          }
        }
      };
    });
    if (interlocutors.length > 0) {
      const users = await this.db.User.findByManyId(interlocutors);
      users.forEach(u => {
        chats.find(c => c.name === u._id).name = u.name;
      });
    }
    if (unreadChats.length > 0) {
      const unreadCount = await this.db.Message.countUnread(unreadChats, userId);
      unreadCount.forEach(u => {
        chats.find(c => c.id === u.chatId).unread_messages = u.count;
      });
    }
    return { ok: true, chats };
  }

  /**
   * Messages of specific chat
   */
  async ['GET /:chat_id | auth, isChatMember'](req) {
    const { limit, page } = req.query;
    const params = {
      chatId: req.params.chat_id,
      limit,
      page
    }
    const messages = await this.serviceMessage.getMany(params);
    return { ok: true, messages };
  }

  /**
   * Create chat
   */
  async ['POST / | auth'](req) {
    const params = { ...req.body, ...{ userId: req.user._id } };
    const chat = await this.serviceChat.create(params);
    return {
      ok: true,
      chat: pick(chat, ['id'])
    };
  }

  /**
   * Leave/delete chat
   * @todo: define schema
   */
  async ['DELETE /:chat_id | auth, isChatMember'](req) {
    const params = {
      userId: req.user._id,
      chat: req.chat
    };
    /**
     * @todo: Add condition, if chat has been removed then remove all related messages
     */
    await this.serviceChat.leaveChat(params);
    return { ok: true };
  }


  /**
   * Add new user to a chat
   * @todo: define schema
   * @todo: add localization for the error messages
   */
  async ['PUT /:chat_id/add_member/:user_id | auth, isChatMember, isChatAdmin']({
    chat, params
  }) {
    if (chat.type !== 1) {
      throw this.Boom.forbidden(`It's disallow to add new member to not a group chat`);
    }
    const { user_id: memberId } = params;
    /**
     * Check whether user already in chat
     */
    if (chat.members.find(m => m.user_id === memberId) instanceof Object) {
      throw this.Boom.badRequest('User already is in the chat');
    }
    const member = await this.db.User.findOne({ _id: memberId });
    if (!(member instanceof Object)) {
      throw this.Boom.badRequest('User does not exist');
    }
    await this.db.Chat.addMember({ member, chat });
    return { ok: true };
  }
}

module.exports = Chat;