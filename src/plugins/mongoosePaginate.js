'use string'

function mongoosePaginate(schema, options) {
  schema.statics.findAndPaginate = function({ query = {}, sort, limit, page }) {
    const mQuery = this.find(query).limit(limit);
    const skip = limit * (page - 1);
    mQuery.skip(skip);
    if (sort instanceof Object) {
      mQuery.sort(sort);
    }

    return mQuery.exec();
  };
}

module.exports = mongoosePaginate;