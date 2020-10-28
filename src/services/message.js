'use string'

class MessageService {
  constructor() {}

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

  /**
   * Delete bunch of messages
   */
  async deleteMany({ ids, chatId, userId }) {
    const condition = {
      _id: { $in: ids },
      chat_id: chatId,
      'statuses.recipient_id': userId
    };
    const messages = await this.db.Message.find(condition);
    if (messages.length !== ids.length) {
      throw new Error();
    }
    return this.db.Message.update(
      condition,
      { $pull: {
          statuses: { recipient_id: userId }
        }
      },
      { multi: true }
    );
  }

  /**
   * Delete messages having empty array of statuses
   */
  async deleteWithEmptyStatuses(ids) {
    const messages = await this.db.Message.find({
      _id: { $in: ids },
      statuses: []
    });
    if (messages.length > 0) {
      return this.db.Message.remove({
        _id: {
          $in: messages.map(m => m._id)
        }
      });
    }
  }
}

module.exports = MessageService;