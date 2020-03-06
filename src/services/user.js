'use string'

class UserService {
  constructor() {}

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
}

module.exports = UserService;