'use string'

class User {
  constructor() {
    this.prefix = '/user';
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
        await this.serviceUser.register(req.body);
        return { ok: true };
      }
    };
  }
}

module.exports = User;