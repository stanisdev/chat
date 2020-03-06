'use string'

const path = require('path');
const rootDir = path.dirname(__dirname);

const config = {
  rootDir,
  routesDir: path.join(rootDir, 'routes'),
  servicesDir: path.join(rootDir, 'services'),
  port: 3000,
  mongo: {
    host: 'localhost',
    port: 27017,
    db: 'chat',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
};

module.exports = config;