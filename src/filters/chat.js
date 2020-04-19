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
  async isAdmin(req) {
    const member = req.chat.members.find(m => m.user_id === req.user._id);
    if (!(member instanceof Object) || member.status !== 1) {
      throw this.Boom.forbidden('It is disallow to add a new member');
    }
  }
}

module.exports = ChatFilter;