'use string'

class ChatService {
  constructor() {}

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
}

module.exports = ChatService;