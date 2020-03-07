'use string'

class Auth {
  constructor() {
    this.prefix = '/auth';
  }

  /**
   * Register new user
   */
  ['POST: /register']() {
    return {
      body: {
        email: {
          type: 'string',
          format: 'email',
          minLength: 6,
          maxLength: 50
        },
        password: { type: 'string', minLength: 4 },
        name: { type: 'string' },
        Required: ['email', 'password', 'name']
      },
      async h(req) {
        await this.serviceAuth.register(req.body);
        return { ok: true };
      }
    };
  }

  /**
   * Login user by email/password
   */
  ['POST: /login']() {
    return {
      body: {
        email: {
          type: 'string',
          format: 'email',
          minLength: 6,
          maxLength: 50
        },
        password: { type: 'string', minLength: 4 },
        Required: ['email', 'password']
      },
      res: {
        token: { type: 'string' }
      },
      async h(req) {
        const userData = await this.serviceAuth.login(req.body);
        const token = await this.jwt.sign(userData);
        return { ok: true, token };
      }
    };
  }
}

module.exports = Auth;