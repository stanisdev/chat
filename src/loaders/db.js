'use string'

const fp = require('fastify-plugin');
const { join } = require('path');

async function db(fastify, opts) {
  const Db = require(join(fastify.config.dbDirs.scripts, 'db'));
  const db = new Db(fastify.config);

  try {
    await db.connect();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.decorate('db', db.getModels());
}

module.exports = fp(db);