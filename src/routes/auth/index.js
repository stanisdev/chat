'use string'

class Auth {
  constructor() {
    this.prefix = '/auth';
  }

  /**
   * Registration of a user
   */
  async ['POST /register']({ body }) {
    await this.serviceAuth.register(body);
    return { ok: true };
  }

  /**
   * Login user by email/password
   */
  async ['POST /login | maxAttemptsToLogin'](req) {
    const userData = await this.serviceAuth.login(req);
    const token = await this.jwt.sign(userData);
    return {
      ok: true,
      token,
      user: {
        id: userData._id,
        name: userData.name
      }
    };
  }
}

module.exports = Auth;