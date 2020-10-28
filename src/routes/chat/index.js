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
    user
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
   * Add new member to a chat
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