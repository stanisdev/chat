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
}

module.exports = RestrictionFilter;