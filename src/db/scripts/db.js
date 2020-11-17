'use strict';

const mongoose = require('mongoose');
const glob = require('glob');
const { basename } = require('path');

class Db {
  constructor(config) {
    this.config = config;
  }

  /**
   * An attempt to establish connection with MongoDB
   */
  async connect() {
    const { host, port, db, options } = this.config.mongo;
    await mongoose.connect(`mongodb://${host}:${port}/${db}`, options); // @todo: add user/password
    if (this.config.logging) {
      mongoose.set('debug', true);
    }
  }

  /**
   * Get object of models
   */
  getModels() {
    const models = {};
    glob
      .sync(this.config.dbDirs.models + '/*.js')
      .forEach(filePath => {
        const fileName = basename(filePath).slice(0, -3);
        const modelName = fileName.slice(0, 1).toUpperCase() + fileName.slice(1);
        
        const modelSchema = require(filePath);
        /**
         * Appoint the plugins
         */
        glob
          .sync(this.config.dbDirs.plugins + '/*.js')
          .forEach(pluginPath => {
            const plugin = require(pluginPath);
            modelSchema.plugin(plugin);
          });
        models[modelName] = mongoose.model(modelName, modelSchema);
      });
    return models;
  }
}

module.exports = Db;