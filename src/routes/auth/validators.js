'use strict';

const config = require('../../config');

const email = {
  type: 'string',
  format: 'email',
  minLength: 6,
  maxLength: 50
};
const password = {
  type: 'string',
  minLength: 4
};

const validators = {
  ['POST /register']: {
    description: 'Registration of a user',
    body: {
      type: 'object',
      properties: {
        email,
        password,
        name: {
          type: 'string'
        },
      },
      required: ['email', 'password', 'name']
    }
  },
  ['GET /confirm/:code']: {
    description: `Confirm user's email using a code`,
    params: {
      type: 'object',
      properties: {
        code: {
          minLength: config.user.confirmEmail.codeLength,
          maxLength: config.user.confirmEmail.codeLength
        }
      }
    }
  },
  ['POST /login']: {
    description: 'Login a user and return JWT token',
    body: {
      type: 'object',
      properties: {
        email,
        password
      },
      required: ['email', 'password']
    },
    response: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      }
    },
  },
  ['POST /reset-password/start']: {
    description: 'Reset password (start the procedure)',
    body: {
      type: 'object',
      properties: {
        email
      },
      required: ['email']
    }
  },
  ['PUT /reset-password/complete']: {
    description: 'Reset password (start the procedure)',
    body: {
      type: 'object',
      properties: {
        email,
        password,
        code: {
          type: 'string'
        }
      },
      required: ['email', 'password', 'code']
    }
  }
};

module.exports = validators;