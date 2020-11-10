'use string'

const { pick } = require('lodash');

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * Get list of chats
   */
  async ['GET / | auth']({
    user,
    query: { limit, page }
  }) {
    const { Chat } = this.db;
    let chats = await Chat.findAndPaginate({
      query: {
        'members.user_id': user._id
      },
      limit,
      page
    });
    const chatsIds = chats.map(({ _id }) => _id);
    const [lastMessages, unreadMessages] = await Promise.all([
      Chat.getLastMessages(chatsIds),
      Chat.getUnreadMessages(chatsIds, user._id),
    ]);
    /**
     * Build up array of chats
     */
    chats = chats.map(chat => {
      const isDialog = chat.type === 0;

      const lastMessage = lastMessages.find(message => message.chat_id === chat._id);
      let author = lastMessage.author?.[0].name;
      if (typeof author !== 'string') {
        author = 'Unknown'; // @todo: get from the locales
      }
      let unreadAmount = unreadMessages
        .find(element => element.chat_id === chat._id)?.count ?? 0;

      const result = {
        id: chat._id,
        name: null,
        type: chat.type,
        last_message: {
          author,
          content: lastMessage.content,
          created_at: lastMessage.created_at,
        },
        unread_messages: unreadAmount
      };
      if (isDialog) {
        const interlocutor = chat.members.find(member => member.user_id !== user._id);
        result.name = interlocutor.name;
        result.last_message.viewed = Boolean(lastMessage.viewed);
      }
      else {
        result.name = chat.name;
      }
      return result;
    });
    return chats;
  }

  /**
   * Get messages from a chat
   */
  async ['GET /:chat_id | auth, chat.is-member']({
    query: { limit, page },
    chat,
    user, t
  }) {
    const messages = await this.db.Message.findAndPaginate({
      query: {
        chat_id: chat._id,
        'statuses.recipient_id': user._id
      },
      sort: { created_at: -1 },
      limit,
      page
    });
    const authorsIds = [...new Set(
      messages.map(message => message.author_id)
    )];
    const authors = await this.db.User.find({
      _id: { $in: authorsIds }
    }, '_id, name');

    /**
     * Build up the list of the messages
     */
    const result = messages.map(({
      _id: id,
      created_at,
      author_id,
      content,
      type,
      statuses,
      viewed
    }) => {
      const author = authors.find(author => author._id === author_id);
      const message = {
        id,
        content,
        type,
        created_at,
        author: {
          id: author._id,
          name: author.name
        }
      };
      if (chat.type === 0 && user._id === author_id) {
        if (typeof viewed === 'boolean') {
          message.viewed = viewed;
        }
        else {
          const status = statuses.find(status => status.recipient_id !== user._id);
          message.viewed = Boolean(status?.value);
        }
      }
      /**
       * Set appropriate translation for a message
       * with status 'system/message'
       * 
       * @todo: Process the case when a user was added
       */
      if (message.type === 'system/message') {
        message.content = message.author.name + ' ' + t(`chat.${message.content}`);
      }
      return message;
    });
    return result;
  }

  /**
   * Create new chat
   * @todo: add restriction of creating too many chats per hour
   * @todo: during the creation of a group chat require 
   * to specify the name
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
   * Leave/delete a chat
   */
  async ['DELETE /:chat_id | auth, chat.is-member']({
    user: { _id: userId },
    chat: { _id: chatId, members, type }
  }) {
    const { Chat } = this.db;
    /**
     * If a group chat
     */
    if (type === 1) {
      if (members.length > 1) {
        const recipients = members.map(member => member.user_id);
        await Chat.removeMember(chatId, userId, recipients);
      }
      else {
        await Chat.removeOneById(chatId);
      }
    } else {
      const interlocutor = members.find(member => member.user_id !== userId);

      /**
       * The interlocutor of a dialog has left also
       * then remove the chat.
       */
      if (interlocutor.is_deleted) {
        await Chat.removeOneById(chatId);
      }
      else {
        await Chat.setMemberAsDeleted(chatId, userId);
      }
    }
    return { ok: true };
  }

  /**
   * Add new members to a chat
   */
  async ['PUT /add_members | auth, chat.is-admin']({
    body,
    user, t,
    chat: { members }
  }) {
    const userIds = [...new Set(body.user_ids)];
    /**
     * Check whether a user is already in a chat
     */
    for (let a = 0; a < userIds.length; a++) {
      const userId = userIds[a];
      if (members.find(member => member.user_id === userId) instanceof Object) {
        throw this.Boom.badRequest({
          user_ids: t('chat.user-already-in-chat')
        });
      }
    }
    /**
     * Check the correctness of all users ids
     */
    const users = await this.db.User.find({
      _id: userIds
    }, '_id, name');
    if (users.length !== userIds.length) {
      throw this.Boom.badRequest({
        user_id: t('user.not-found')
      });
    }
    const params = {
      adminId: user._id,
      chatId: body.chat_id,
      users,
      recipients: members.map(member => member.user_id)
    };
    await this.db.Chat.addMembers(params);
    return { ok: true };
  }
}

module.exports = Chat;