'use strict';

const validators = {
  ['PUT /:chat_id']: {
    description: 'Writing new message to certain chat',
    body: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        type: {
          type: 'string',
          enum: ['text/plain', 'image/jpeg']
        }
      },
      required: ['content', 'type']
    },
    query: {
      type: 'object',
      properties: {
        chat_id: { type: 'string' }
      }
    },
    response: {
      message: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          type: { type: 'string' },
          created_at: { type: 'number' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      }
    },
  },
  ['GET /:chat_id/:ids']: {
    description: 'Updating statuses of one and more messages (mark messages as read)',
  },
  ['DELETE /:chat_id/:ids']: {
    description: 'Deleting messages'
  },
  ['']: {}
};

module.exports = validators;