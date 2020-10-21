'use string'

const { pick } = require('lodash');
const { strictEqual: equal } = require('assert').strict;
const { nanoid } = require('nanoid/async');

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
    const config = this.config.user.confirmEmail;
    /**
     * Define a code to confirm email
     * @todo: add mailer
     */
    body.code = {
      value: await nanoid(config.codeLength),
      ttl: new Date(Date.now() + config.ttl)
    }
    const user = new User(body);
    await user.cryptPassword();
    await user.save();
    return { ok: true };
  }

  /**
   * Confirm user's email
   */
  async ['GET /confirm/:code']({ params }) {
    const user = await this.db.User.findOne({
      'code.value': params.code
    }, '_id code status');
    if (!(user instanceof Object)) {
      throw this.Boom.badRequest({ code: 'Unrecognizable code value' });
    }
    const { ttl } = user.code;
    /**
     * If ttl has expired thrown the error and 
     * remove the 'code' field
     */
    if (ttl <= new Date()) {
      user.code = {};
      await this.db.User.updateOne(
        { _id: user._id },
        { $unset: { code: '' } }
      );
      throw this.Boom.badRequest({ code: 'The code has expired' });
    }
    user.code = {};
    user.status = 1;
    await user.save();
    return { ok: true };
  }

  /**
   * Login user by email/password
   */
  async ['POST /login | login.max-attempts']({
    body: { email, password },
    attempts,
    key
  }) {
    let user = await this.db.User.findOne({ email });
    try {
      equal(user instanceof Object, true);
      equal(await user.checkPassword(password), true);
    } catch {
      /**
       * Increase counter of attempts in redis
       */
      await this.redis.set(key, attempts + 1, 'EX', this.config.auth.blockedUserTtl);
      throw this.Boom.badRequest({ password: 'Wrong email/password' });
    }
    if (user.status === 0) {
      throw this.Boom.forbidden({ email: 'You did not confirm the email address' });
    }

    user = pick(user, ['_id', 'name']);
    return {
      token: await this.jwt.sign(user),
      user
    };
  }

  /**
   * Init the procedure of resetting a user's password
   */
  async ['POST /reset-password/start']({ body }) {
    const user = await this.db.User.findOne({ email: body.email });
    if (user instanceof Object) {
      const code = await nanoid(this.config.user.resetPassword.codeLength);
      user.code = {
        value: code,
        ttl: Date.now() + this.config.user.resetPassword.ttl
      }
      await user.save();
    }
    /**
     * It is better to avoid granting a user to pluck
     * existing email addresses in DB
     */
    return { ok: true };
  }

  /**
   * To complete the procedure of resetting a user's password
   */
  async ['PUT /reset-password/complete | reset-password.max-attempts']({
    body,
    key,
    attempts
  }) {
    const user = await this.db.User.findOne({ email: body.email });
    if (!(user instanceof Object)) {
      throw this.Boom.badRequest({ email: 'Wrong email' });
    }
    const { code } = user;
    try {
      equal(code.value, body.code);
      equal(new Date() < new Date(code.ttl), true);
    } catch {
      const { ttl } = this.config.user.resetPassword.attempts;
      await this.redis.set(key, attempts + 1, 'EX', ttl);

      throw this.Boom.badRequest({
        code: 'Wrong value of code or availability of the code has expired'
      });
    }
    /**
     * All checks has been evaluated successfully
     */
    user.password = body.password;
    user.code = {};
    await user.cryptPassword();
    await user.save();
    return { ok: true };
  }
}

module.exports = Auth;