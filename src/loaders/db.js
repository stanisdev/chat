'use string'

const fp = require('fastify-plugin');
const mongoose = require('mongoose');
const glob = require('glob');
const path = require('path');

async function db(fastify, options) {
  try {
    await mongoose.connect('mongodb://localhost:27017/chat', { useNewUrlParser: true, useUnifiedTopology: true }); // @todo: move to config
  } catch (err) {
    fastify.log.error(err);
  }
  const models = {};

  glob
    .sync(fastify.config.rootDir + '/models/*.js')
    .forEach(filePath => {
      const fileName = path.basename(filePath).slice(0, -3);
      const modelName = fileName.slice(0, 1).toUpperCase() + fileName.slice(1);
      models[modelName] = require(filePath);
    });
  fastify.decorate('db', models);
}

module.exports = fp(db);