'use string'

class RestrictionFilter {
  async maxIds(req) {
    const limit = this.config.messages.maxStatusesToBeUpdated;
    const ids = req.params.ids.split(',');
    if (ids.length > limit) {
      throw this.Boom.badRequest({
        ids: `Allowed amount of statuses to be updated is ${limit}`
      });
    }
    req.params.ids = ids;
  }

  async maxAttemptsToLogin(req) {
    const { email } = req.body;
    const limit = this.config.auth.maxAttemptsToLogin - 1;
    let count = await this.redis.get(`e:${email}`);
    count = parseInt(count);
    if (!Number.isInteger(count)) {
      return;
    }
    if (count > limit) {
      throw this.Boom.badRequest('You have exceeded maximum allowable count of attempts to login');
    }
    req.loginAttempts = count;
  }
}

module.exports = RestrictionFilter;