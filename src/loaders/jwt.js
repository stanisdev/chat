'use string'

const fp = require('fastify-plugin');

async function jwt(fastify, options) {
  fastify.register(require('fastify-jwt'), fastify.config.jwt);

  fastify.decorate('authenticate', async function(req, reply) {
    try {
      await req.jwtVerify();
    } catch (err) {
      throw fastify.Boom.unauthorized('Private area. You have to be authorized');
    }
  });
}

module.exports = fp(jwt);