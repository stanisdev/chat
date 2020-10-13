'use string'

const { pick } = require('lodash');
const { strictEqual: equal } = require('assert').strict;

class Auth {
  constructor() {
    this.prefix = '/auth';
  }

  /**
   * Registration of a user
   */
  async ['POST /register']({ body }) {
    const { User } = this.db;

    const check = await User.findOne({
      email: body.email
    });
    if (check instanceof Object) {
      throw this.Boom.badRequest({ email: 'Email already exists' });
    }
    const user = new User(body);
    await user.cryptPassword();
    await user.save();
    return { ok: true };
  }

  /**
   * Login user by email/password
   */
  async ['POST /login | maxAttemptsToLogin']({
    body: { email, password },
    loginAttempts
  }) {
    let user = await this.db.User.findOne({ email });
    try {
      equal(user instanceof Object, true);
      equal(await user.checkPassword(password), true);
    } catch {
      /**
       * Increase counter of attempts in redis
       */
      const counter = Number.isInteger(loginAttempts) ? loginAttempts + 1 : 1;
      await this.redis.set(`e:${email}`, counter, 'EX', this.config.auth.blockedUserTtl);
      throw this.Boom.badRequest({ password: 'Wrong email/password' });
    }

    user = pick(user, ['_id', 'name']);
    return {
      token: await this.jwt.sign(user),
      user
    };
  }
}

module.exports = Auth;