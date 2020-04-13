'use string'

const { pick } = require('lodash');

class AuthService {
  constructor() {
    this.wrongCredentials = { email: 'Wrong email/password' };
  }

  async register(body) {
    const { User } = this.db;
    const checkUser = await User.findOne({
      email: body.email
    });
    if (checkUser instanceof Object) {
      throw this.Boom.badRequest({ email: 'Email already exists' });
    }
    const user = new User(body);
    await user.cryptPassword();
    await user.save();
  }

  async login({
    body: { email, password },
    loginAttempts
  }) {
    const user = await this.db.User.findOne({ email });
    try {
      if (!(user instanceof Object)) {
        throw new Error();
      }
      const isValid = await user.checkPassword(password);
      if (!isValid) {
        throw new Error();
      }
    } catch {
      /**
       * Increase counter of attempts in redis
       */
      const counter = Number.isInteger(loginAttempts) ? loginAttempts + 1 : 1;
      await this.redis.set(`e:${email}`, counter, 'EX', this.config.auth.blockedUserTtl);
      throw this.Boom.badRequest(this.wrongCredentials);
    }
    return pick(user, ['_id', 'name']);
  }
}

module.exports = AuthService;