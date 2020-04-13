'use string'

const fp = require('fastify-plugin');
const glob = require('glob');
const path = require('path');

async function filters(fastify, options) {
  const { config, db } = fastify;
  const filters = {};
  glob
    .sync(config.filtersDir + '/*.js')
    .forEach(file => {
      const name = path.basename(file).slice(0, -3).toLowerCase();
      const Class = require(file);
      Class.prototype.db = db;
      Class.prototype.Boom = fastify.Boom;
      Class.prototype.config = fastify.config;
      Class.prototype.redis = fastify.redis;
      filters[name] = new Class();
    });

  fastify.decorate('filters', filters);
}

module.exports = fp(filters);