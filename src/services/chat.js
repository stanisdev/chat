'use string'

class ChatService {
  constructor() {}

  /**
   * Create chat
   */
  async create({ type, members, userId }) {
    const { Chat, User } = this.db;
    members = [... new Set(members)].filter(id => id !== userId);

    /**
     * Check dialog existence
     */
    if (type === 0) {
      if (members.length !== 1) {
        throw this.Boom.badRequest({ members: 'Count of members has to be equal 1' });
      }
      const chat = await Chat.findDialog(members);
      if (chat instanceof Object) {
        return chat;
      }
    }
    members.push(userId);
    /**
     * Check ids of members
     */
    const users = await User.find({
      _id: { $in: members }
    });
    if (users.length !== members.length) {
      throw this.Boom.badRequest({ members: 'Wrong list of id of members' });
    }
    /**
     * Create new one
     */
    members = members.map(memberId => {
      const user = users.find(u => u._id === memberId);
      const result = {
        user_id: memberId,
        name: user.name
      };

      if (type === 0) {
        result.is_deleted = false;
        return result;
      }
      result.status = memberId === userId ? 1 : 0;
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