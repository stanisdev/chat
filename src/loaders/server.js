'use string'

// const cors = require('cors');
const config = require('../config');
const fastify = require('fastify')(config.server);
const { pick } = require('lodash');

fastify.register(require('fastify-formbody'));
// fastify.use(cors());
fastify.decorate('config', config);
fastify.register(require('./db'));
fastify.register(require('./redis'));
fastify.register(require('./boom'));
fastify.register(require('./errors'));
fastify.register(require('./jwt'));
fastify.register(require('./services'));
fastify.register(require('./middlewares'));
fastify.register(require('./swagger'));
fastify.register(require('./websocket'));
fastify.register(require('./i18next'));
fastify.register(require('./routes'));

const start = async () => {
  try {
    await fastify.listen(pick(config, ['port', 'host']));
    return fastify.server;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

module.exports = start;