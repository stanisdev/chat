'use string'

const fp = require('fastify-plugin');

async function cors(fastify, options) {
  fastify.register(require('fastify-cors'), {
    origin(origin, cb) {
      if (/localhost/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed'), false);
    }
  });
  fastify.register(require('fastify-formbody'));
}

module.exports = fp(cors);