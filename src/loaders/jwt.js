'use string'

const fp = require('fastify-plugin');

async function jwt(fastify, options) {
  fastify.register(require('fastify-jwt'), fastify.config.jwt);
}

module.exports = fp(jwt);