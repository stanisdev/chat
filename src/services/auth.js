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

  async login(body) {
    const { email, password } = body;
    const user = await this.db.User.findOne({ email });
    if (!(user instanceof Object)) {
      throw this.Boom.badRequest(this.wrongCredentials);
    }
    const isValid = await user.checkPassword(password);
    if (!isValid) {
      throw this.Boom.badRequest(this.wrongCredentials);
    }
    return pick(user, ['id', 'name']);
  }
}

module.exports = AuthService;