'use string'

const fp = require('fastify-plugin');
const mongoose = require('mongoose');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

async function db(fastify, opts) {
  const { host, port, db, options } = fastify.config.mongo;
  try {
    await mongoose.connect(`mongodb://${host}:${port}/${db}`, options); // @todo: add user/password
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  if (fastify.config.logging) {
    mongoose.set('debug', true);
  }
  const models = {};

  glob
    .sync(fastify.config.modelsDir + '/*.js')
    .forEach(filePath => {
      const fileName = path.basename(filePath).slice(0, -3);
      const modelName = fileName.slice(0, 1).toUpperCase() + fileName.slice(1);
      models[modelName] = require(filePath);
    });
  fastify.decorate('db', models);
}

module.exports = fp(db);