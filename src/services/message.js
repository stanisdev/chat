'use string'

class MessageService {
  constructor() {}

  create({ userId, chat, body: { content, type } }) {
    const statuses = chat.members.map(member => {
      const memberId = member.user_id;
      let value = 0;
      if (memberId === userId) {
        value = 1; // For message's author
      }
      return {
        recipient_id: memberId,
        value
      };
    });
    const message = new this.db.Message({
      author_id: userId,
      chat_id: chat._id,
      content: content,
      type: type,
      statuses
    });
    return message.save();
  }
}

module.exports = MessageService;