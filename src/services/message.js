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
      content,
      type,
      statuses
    });
    return message.save();
  }

  /**
   * Get messages of certain chat
   */
  async getMany({ chatId, limit, page }) {
    let messages = await this.db.Message.findAndPaginate({
      query: {
        chat_id: chatId
      },
      limit,
      page,
      sort: { created_at: 1 }
    });
    const authorsIds = new Set();
    messages = messages.map(m => {
      authorsIds.add(m.author_id);

      return {
        id: m._id,
        content: m.content,
        type: m.type,
        created_at: new Date(m.created_at).getTime(),
        author_id: m.author_id
      };
    });

    /**
     * Get unique authors of all retrieved messages
     */
    const authors = await this.db.User.find({
      _id: { $in: [...authorsIds] }
    });
    return messages.map(m => {
      let name = 'Deleted';
      const author = authors.find(a => a._id === m.author_id);
      if (author instanceof Object) {
        name = author.name;
      }
      m.author = { name, id: m.author_id };
      return m;
    });
  }

  /**
   * Describe this
   */
  updateStatuses(messages, userId) {
    const tasks = [];
    messages.forEach(m => {
      const { statuses } = m;
      const index = statuses.findIndex(s => s instanceof Object && s.recipient_id === userId);
      if (index < 0) {
        return;
      }
      const task = this.db.Message.update(
        {
          _id: m._id,
          chat_id: m.chat_id
        },
        /**
         * Update element of array by index
         * https://docs.mongodb.com/manual/reference/operator/update/set/#set-elements-in-arrays
         */
        {
          $set: { [`statuses.${index}.value`]: 1 }
        }
      );
      tasks.push(task);
    });
    return Promise.all(tasks);
  }
}

module.exports = MessageService;