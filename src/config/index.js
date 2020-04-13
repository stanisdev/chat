'use string'

const path = require('path');
const rootDir = path.dirname(__dirname);
const { env } = process;

const config = {
  rootDir,
  routesDir: path.join(rootDir, 'routes'),
  servicesDir: path.join(rootDir, 'services'),
  filtersDir: path.join(rootDir, 'filters'),
  modelsDir: path.join(rootDir, 'models'),
  port: env.PORT || 3000,
  host: env.HOST || '127.0.0.1',
  mongo: {
    host: 'localhost',
    port: 27017,
    db: 'chat',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  websocket: {
    port: 8080,
    maxPayload: 1048576
  },
  redis: {
    port: 6379,
    host: '127.0.0.1',
    db: 0,
    password: null
  },
  server: {
    ignoreTrailingSlash: true,
    logger: true
  },
  jwt: {
    secret: env.JWT_SECRET || 'k6b8JHnLCrH4dE6nkxprYLF49'
  },
  chats: {
    limit: {
      max: 20,
      default: 10
    },
  },
  messages: {
    limit: {
      max: 30,
      default: 10
    },
    /**
     * Maximum amount of statuses to be updated
     */
    maxStatusesToBeUpdated: 20
  },
  auth: {
    maxAttemptsToLogin: 4,
    blockedUserTtl: 60 * 60 // being measured in seconds
  }
};

module.exports = config;