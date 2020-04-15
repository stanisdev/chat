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
   * User leaves a chat
   */
  async leaveChat({ userId, chat }) {
    const { type, members } = chat;
    const { Chat } = this.db;
    if (type === 0) { // dialog
      /**
       * It is considering the case if interlocutor also has left before
       */
      const interlocutor = members.find(m => m.user_id !== userId);
      if (interlocutor.is_deleted === true) {
        return Chat.removeOneById(chat._id);
      }
      const index = members.findIndex(m => m.user_id === userId);

      if (members[index].is_deleted === true) { // user has already left before
        return;
      }
      return Chat.updateOne(
        { _id: chat._id },
        {
          $set: { [`members.${index}.is_deleted`]: true }
        }
      );
    }
    else { // group
      if (members.length < 2) {
        return Chat.removeOneById(chat._id);
      }
      return Chat.updateOne(
        { _id: chat._id },
        {
          $pull: {
            members: { user_id: userId }
          }
        }
      );
    }
  }
}

module.exports = ChatService;