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
  async ['GET /:chat_id | auth, chat.is-member'](req) {
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
   * Create new chat
   * @todo: add restriction of creating too many chats per hour
   */
  async ['POST / | auth']({
    body: { members, type },
    user: owner, t
  }) {
    members = [... new Set(members)].filter(id => id !== owner._id);
    if (members.length < 1) {
      throw this.Boom.badRequest({
        members: t('chat.wrong-members')
      });
    }
    const isDialog = type === 0;
    members.push(owner._id);
    /**
     * Check dialog existence
     */
    if (isDialog) {
      if (members.length !== 2) {
        throw this.Boom.badRequest({
          members: t('chat.wrong-members-for-dialog')
        });
      }
      const chat = await this.db.Chat.findDialog(members);
      if (chat instanceof Object) {
        return chat;
      }
    }
    /**
     * Check correctness of members ids
     */
    const users = await this.db.User.find({
      _id: { $in: members }
    });
    if (users.length !== members.length) {
      throw this.Boom.badRequest({
        members: t('chat.wrong-members')
      });
    }
    const chat = await this.db.Chat.createNew({
      members, users, isDialog, owner, type
    });
    return {
      chat: pick(chat, ['_id', 'type'])
    };
  }

  /**
   * Leave/delete chat
   * @todo: define schema
   */
  async ['DELETE /:chat_id | auth, chat.is-member'](req) {
    const params = {
      userId: req.user._id,
      chat: req.chat
    };
    /**
     * @todo: Add condition, if chat has been removed
     * then remove all related messages
     */
    await this.serviceChat.leaveChat(params);
    return { ok: true };
  }


  /**
   * Add new user to a chat
   * @todo: define schema
   * @todo: add localization for the error messages
   */
  async ['PUT /:chat_id/add_member/:user_id | auth, chat.is-member, chat.is-admin']({
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