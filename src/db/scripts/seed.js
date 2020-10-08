'use strict';

const config = require('../../config');
const glob = require('glob');
const { basename } = require('path');
const Db = require('./db');
const { capitalize } = require('lodash')

const start = async () => {
  const db = new Db(config);
  await db.connect();
  const models = db.getModels();

  const files = glob.sync(config.dbDirs.seeders + '/*.js');
  for (let a = 0; a < files.length; a++) {
    const file = files[a];
    const seeders = require(file);

    const name = basename(file).slice(0, -3);
    const Model = models[capitalize(name)];
    await Model.deleteMany();

    for (let b = 0; b < seeders.length; b++) {
      const seeder = seeders[b];
      await new Model(seeder).save();
    }
  }
  console.log('Seeders loaded');
  process.exit();
};

start();