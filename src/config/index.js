'use string'

const { dirname, join } = require('path');
const rootDir = dirname(__dirname);
const env = process.env.NODE_ENV || 'development';
const { merge } = require('lodash');
const logging = env !== 'test';

const environments = {
  test: {
    port: 3002,
    redis: {
      db: 2
    },
    mongo: {
      db: 'chat_test'
    }
  },
  development: {
    port: 3001,
    redis: {
      db: 1
    },
    mongo: {
      db: 'chat_dev'
    }
  },
  production: {
    port: 3000,
    redis: {
      db: 0
    },
    mongo: {
      db: 'chat'
    }
  }
};

const config = {
  rootDir,
  routesDir: join(rootDir, 'routes'),
  servicesDir: join(rootDir, 'services'),
  middlewaresDir: join(rootDir, 'middlewares'),
  localesDir: join(rootDir, 'locales'),
  host: process.env.HOST || '127.0.0.1',
  dbDirs: {
    models: join(rootDir, 'db', 'models'),
    scripts: join(rootDir, 'db', 'scripts'),
    seeders: join(rootDir, 'db', 'seeders'),
  },
  logging,
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
    logger: logging
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'k6b8JHnLCrH4dE6nkxprYLF49'
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
  },
  user: {
    confirmEmail: {
      codeLength: 20,
      ttl: 1000 * 60 * 60
    },
    resetPassword: {
      codeLength: 40,
      ttl: 1000 * 60 * 60 * 24,
      attempts: {
        value: 5,
        ttl: 60 * 5
      }
    }
  }
};

module.exports = merge(config, environments[env]);