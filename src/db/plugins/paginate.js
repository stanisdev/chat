'use string'

function mongoosePaginate(schema, options) {
  /**
   * Define the method as static
   */
  schema.statics.findAndPaginate = function({
    query = {}, select,
    sort, limit, page
  }) {
    const mQuery = this.find(query).limit(limit);
    const skip = limit * (page - 1);

    mQuery.skip(skip);

    if (sort instanceof Object) {
      mQuery.sort(sort);
    }
    if (typeof select === 'string') {
      mQuery.select(select);
    }
    return mQuery.exec();
  };
}

module.exports = mongoosePaginate;