'use string'

const path = require('path');
const rootDir = path.dirname(__dirname);
const { env } = process;

const config = {
  rootDir,
  routesDir: path.join(rootDir, 'routes'),
  servicesDir: path.join(rootDir, 'services'),
  filtersDir: path.join(rootDir, 'filters'),
  port: 3000,
  mongo: {
    host: 'localhost',
    port: 27017,
    db: 'chat',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  server: {
    ignoreTrailingSlash: true,
    logger: true
  },
  jwt: {
    secret: env.JWT_SECRET || 'k6b8JHnLCrH4dE6nkxprYLF49'
  }
};

module.exports = config;