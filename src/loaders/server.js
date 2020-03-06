'use string'

const fastify = require('fastify')({ logger: true });
const Boom = require('@hapi/boom');
const config = require('../config');

fastify.decorate('config', config);
fastify.register(require('./db'));
fastify.register(require('./boom'));
fastify.register(require('./services'));
fastify.register(require('./errors'));
fastify.register(require('./routes'));

(async () => {
  try {
    await fastify.listen(config.port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();