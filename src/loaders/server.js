'use string'

const cors = require('cors');
const config = require('../config');
const fastify = require('fastify')(config.server);
const { pick } = require('lodash');

fastify.use(cors());
fastify.decorate('config', config);
fastify.register(require('./db'));
fastify.register(require('./boom'));
fastify.register(require('./errors'));
fastify.register(require('./jwt'));
fastify.register(require('./services'));
fastify.register(require('./filters'));
fastify.register(require('./swagger'));
fastify.register(require('./websocket'));
fastify.register(require('./routes'));

(async () => {
  try {
    await fastify.listen(pick(config, ['port', 'host']));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();