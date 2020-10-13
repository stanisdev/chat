'use strict';

const fp = require('fastify-plugin');

const middlewares = async (fastify) => {
  fastify.decorate('middlewares', require(fastify.config.middlewaresDir));
};

module.exports = fp(middlewares);