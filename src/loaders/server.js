'use string'

const fastify = require('fastify')({ logger: true });

fastify.decorate('config', require('../config'));
fastify.register(require('./db'));
fastify.register(require('./routes'));

(async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();