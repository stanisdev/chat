'use string'

const config = require('../config');
const fastify = require('fastify')(config.server);

fastify.decorate('config', config);
fastify.register(require('./db'));
fastify.register(require('./boom'));
fastify.register(require('./services'));
fastify.register(require('./errors'));
fastify.register(require('./jwt'));
fastify.register(require('./filters'));
fastify.register(require('./swagger'));
fastify.register(require('./websocket'));
fastify.register(require('./routes'));

(async () => {
  try {
    await fastify.listen(config.port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();