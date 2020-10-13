'use strict';

const middlewares = {
  /**
   * @todo: Define the method
   */
  async auth() {
    
  },
  /**
   * Check whether a user is member of a chat
   */
  async isChatMember(req) {
    const chat = await this.db.Chat.findOne({
      _id: req.params.chat_id,
      'members.user_id': req.user._id
    });
    if (!(chat instanceof Object)) {
      throw this.Boom.forbidden('Access to chat is restricted');
    }
    req.chat = chat;
  },
  /**
   * Check whether a user is admin of a chat
   */
  async isChatAdmin(req) {
    const member = req.chat.members.find(m => m.user_id === req.user._id);
    if (!(member instanceof Object) || member.status !== 1) {
      throw this.Boom.forbidden('You do not have an appropriate rights');
    }
  },
  /**
   * Check whether a user has made too many attempts to login
   */
  async maxAttemptsToLogin(req) {
    const limit = this.config.auth.maxAttemptsToLogin - 1;
    let count = await this.redis.get(`e:${req.body.email}`);
    count = parseInt(count);
    if (!Number.isInteger(count)) {
      return;
    }
    if (count > limit) {
      throw this.Boom.forbidden({
        email: 'You have exceeded the maximum allowable count of attempts to login'
      });
    }
    req.loginAttempts = count;
  },
  /**
   * The restriction to prevent updating too many message statuses
   */
  async maxIds(req) {
    const limit = this.config.messages.maxStatusesToBeUpdated;
    const ids = req.params.ids.split(',');
    if (ids.length > limit) {
      throw this.Boom.badRequest({
        ids: `Allowed amount of statuses to be updated is ${limit}`
      });
    }
    req.params.ids = ids;
  },
  /**
   * Check whether a user is owner of a message
   */
  async isMessageOwner(req) {}
};

module.exports = middlewares;