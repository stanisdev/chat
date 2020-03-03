'use string'

const path = require('path');
const rootDir = path.dirname(__dirname);

const config = {
  rootDir,
  routesDir: path.join(rootDir, 'routes')
};

module.exports = config;