'use strict';

const config = require('../../config');

const validators = {
  ['GET /']: {
    description: 'Get list of user\'s chats',
    query: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: config.chats.limit.max,
          default: config.chats.limit.default,
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      }
    },
    response: {
      chats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'number' },
            name: { type: 'string' },
            unread_messages: { type: 'number' },
            last_message: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                type: { type: 'string' },
                created_at: { type: 'number' },
                author: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    avatar: { type: 'string' }
                  }
                },
              }
            }
          }
        }
      }
    }
  },
  ['GET /:chat_id']: {
    description: 'Get list of messages of a chat',
    params: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          maxLength: 8
        }
      }
    },
    query: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: config.messages.limit.max,
          default: config.messages.limit.default
        },
        page: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      }
    },
    response: {
      messages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' },
            created_at: { type: 'number' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                is_online: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  },
  ['POST /']: {
    description: 'Creating a new chat',
    body: {
      type: 'object',
      properties: {
        type: {
          type: 'integer',
          enum: [0, 1]
        },
        members: {
          type: 'array',
          minItems: 1,
          /**
           * @todo: Add limit to count of allowable members
           */
          items: { type: 'string' }
        }
      },
      required: ['type', 'members']
    },
    response: {
      chat: {
        type: 'object',
        properties: {
          _id: { type: 'string' }
        }
      }
    },
  },
  ['DELETE /:chat_id']: {
    description: 'A user left a chat',
    params: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          maxLength: 8
        }
      }
    }
  },
  ['PUT /add_members']: {
    description: 'Adding new members',
    body: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          maxLength: 8
        },
        user_ids: {
          type: 'array',
          minItems: 1,
          /**
           * @todo: add limit
           */
          items: {
            type: 'string',
            maxLength: 8
          }
        }
      },
      required: ['chat_id', 'user_ids']
    }
  }
};

module.exports = validators;