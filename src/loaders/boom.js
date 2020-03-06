'use string'

const fp = require('fastify-plugin');
const Boom = require('@hapi/boom');

async function boom(fastify, options) {
  const handler = {
    get(target, prop, receiver) {
      return function(message) {
        if (message instanceof Object) {
          message = JSON.stringify(message);
        }
        if (prop === 'getter') {
          return receiver;
        }
        return target[prop](message);
      };
    }
  };
  fastify.decorate('Boom', new Proxy(Boom, handler));
}

module.exports = fp(boom);