'use string'

const fp = require('fastify-plugin');
const glob = require('glob');
const path = require('path');
const _ = require('lodash');

async function services(fastify, options) {
  const { servicesDir } = fastify.config;
  glob
    .sync(servicesDir + '/*.js')
    .forEach(file => {
      const Class = require(file);
      const name = path.basename(file).slice(0, -3);
      Class.prototype.db = fastify.db;
      Class.prototype.Boom = fastify.Boom;
      Class.prototype.redis = fastify.redis;
      Class.prototype.config = fastify.config;

      fastify.decorate('service' + _.capitalize(name), new Class(fastify));
    });
}

module.exports = fp(services);