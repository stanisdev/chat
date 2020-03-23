'use string'

class ChatService {
  constructor() {}

  /**
   * Create chat
   */
  async create(userId, { type, members }) {
    members.push(userId);

    /**
     * Check chat's existence
     */
    const { Chat, User } = this.db;
    const chat = await Chat.findDialog(members);
    if (chat instanceof Object) {
      return chat;
    }
    /**
     * Check ids of members
     */
    const count = await User.countByIds(members);
    if (count !== members.length) {
      throw this.Boom.badRequest({ members: 'Wrong list of id of members' });
    }
    /**
     * Create new one
     */
    members = members.map(memberId => {
      const result = { user_id: memberId };
      if (type === 0) {
        return result;
      }
      if (memberId === userId) {
        result.status = 1;
      } else {
        result.status = 0;
      }
      return result;
    });
    const newChat = new Chat({ type, members });
    return newChat.save();
  }

  /**
   * Get user's chats
   */
  async getMany({ userId, limit, page }) {
    let chats = await this.db.Chat.findAndPaginate({
      query: {
        'members.user_id': userId
      },
      limit,
      page,
      sort: { created_at: -1 }
    });
    const chatIds = [];
    chats = chats.map(({ _id: id, type, members }) => {
      let chatName = 'Not specified';
      if (type === 0) {
        members.forEach(member => {
          if (member instanceof Object && member.user_id !== userId) {
            chatName = member.name;
          }
        });
      }
      else if (type === 1) {
        chatName = `Group chat, ${members.length} members`;
      }
      chatIds.push(id);
      return { id, type, name: chatName };
    });
    return { chats, chatIds };
  }
}

module.exports = ChatService;