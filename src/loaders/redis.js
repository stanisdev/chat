'use string'

const fp = require('fastify-plugin');
const Redis = require('ioredis');

async function redisConnector(fastify) {
  const redis = new Redis(fastify.config.redis);
  fastify.decorate('redis', redis);
}

module.exports = fp(redisConnector);