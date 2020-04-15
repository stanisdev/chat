'use string'

const { pick } = require('lodash');

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * Get user's chats
   */
  ['GET: /']() {
    const limitConfig = this.config.chats.limit;
    return {
      description: 'Get list of user\'s chats',
      auth: true,
      query: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: limitConfig.max,
          default: limitConfig.default
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      res: {
        chats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'number' },
              name: { type: 'string' },
              unread_messages: { type: 'number' },
              last_message: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  type: { type: 'string' },
                  created_at: { type: 'number' },
                  author: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      avatar: { type: 'string' }
                    }
                  },
                }
              }
            }
          }
        }
      },
      async h(req) {
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
    };
  }

  /**
   * Messages of specific chat
   */
  ['GET: /:chat_id']() {
    const limitConfig = this.config.messages.limit;
    return {
      auth: true,
      filters: ['chat.isMember'],
      description: 'Get list of messages of certain chat',
      params: {
        chat_id: { type: 'string', maxLength: 8 }
      },
      query: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: limitConfig.max,
          default: limitConfig.default
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      res: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' },
              created_at: { type: 'number' },
              author: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  is_online: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      async h(req) {
        const { limit, page } = req.query;
        const params = {
          chatId: req.params.chat_id,
          limit,
          page
        }
        const messages = await this.serviceMessage.getMany(params);
        return { ok: true, messages };
      }
    };
  }

  /**
   * Create chat
   */
  ['PUT: /']() {
    return {
      description: 'Creating a new chat',
      auth: true,
      body: {
        type: {
          type: 'integer',
          enum: [0, 1]
        },
        members: {
          type: 'array',
          minItems: 1,
          items: { type: 'string' }
        },
        Required: ['type', 'members']
      },
      res: {
        chat: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      },
      async h(req) {
        const chat = await this.serviceChat.create(req.user, req.body);
        return {
          ok: true,
          chat: pick(chat, ['id'])
        };
      }
    };
  }

  /**
   * Leave/delete chat
   */
  ['DELETE: /:chat_id']() {
    return {
      description: 'User wants to leave a chat',
      auth: true,
      filters: ['chat.isMember'],
      async h(req) {
        const params = {
          userId: req.user._id,
          chat: req.chat
        };
        await this.serviceChat.leaveChat(params);
        return { ok: true };
      }
    };
  }
}

module.exports = Chat;