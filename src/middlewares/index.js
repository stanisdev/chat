'use strict';

const { strictEqual: equal } = require('assert').strict;

const middlewares = {
  /**
   * Decrypt JWT and check user existence
   */
  async auth(req) {
    try {
      await req.jwtVerify();
      const user = await this.db.User.findOne({
        _id: req.user._id
      }, '_id email name');
      equal(user instanceof Object, true);
    } catch {
      throw this.Boom.unauthorized('Private area. You have to be authorized');
    }
  },
  /**
   * Check whether a user is member of a chat
   */
  async ['chat.is-member'](req) {
    const chatId = req.params.chat_id ?? req.body.chat_id;
    const chat = await this.db.Chat.findOne({
      _id: chatId,
      'members.user_id': req.user._id
    });
    if (!(chat instanceof Object)) {
      throw this.Boom.forbidden({
        chat_id: req.t('chat.not-found')
      });
    }
    req.chat = chat;
  },
  /**
   * Check whether a user is admin of a chat
   */
  async ['chat.is-admin'](req) {
    await middlewares['chat.is-member'].bind(this)(req);
    const member = req.chat.members.find(member => member.user_id === req.user._id);
    if (member?.status !== 1) {
      throw this.Boom.forbidden({
        chat_id: req.t('chat.user-is-not-admin')
      });
    }
  },
  /**
   * Check whether a user has made too many attempts to login
   */
  async ['login.max-attempts'](req) {
    const key = `e:${req.body.email}:login`;
    const count = +await this.redis.get(key);

    if (count >= this.config.auth.maxAttemptsToLogin) {
      throw this.Boom.forbidden({
        email: 'You have exceeded the maximum allowable count of attempts to login'
      });
    }
    req.key = key;
    req.attempts = count;
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
  async isMessageOwner(req) {},
  /**
   * Check whether a user has exceeded the maximum attempts
   * to complete resetting password
   */
  async ['reset-password.max-attempts'](req) {
    const key = `e:${req.body.email}:reset_password`;
    const count = +await this.redis.get(key);
    if (count >= this.config.user.resetPassword.attempts.value) {
      throw this.Boom.forbidden({
        email: 'You have exceeded the maximum allowable count of attempts to reset password'
      });
    }
    req.key = key;
    req.attempts = count;
  }
};

module.exports = middlewares;