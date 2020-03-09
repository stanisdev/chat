'use string'

class ChatFilter {
  async isMember(req) {
    const chat = await this.db.Chat.findOne({
      _id: req.params.chat_id,
      'members.user_id': req.user._id
    });
    if (!(chat instanceof Object)) {
      throw this.Boom.forbidden('Access to chat is restricted');
    }
    req.chat = chat;
  }
}

module.exports = ChatFilter;