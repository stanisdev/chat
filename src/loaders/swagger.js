'use string'

const fp = require('fastify-plugin');

async function swagger(fastify, options) {
  fastify.register(require('fastify-swagger'), {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'Chat real-time application API',
        description: 'Detailed description of all endpoints is here',
        version: '0.0.1'
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Link to swagger'
      },
      host: 'localhost',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    },
    exposeRoute: true
  });
}

module.exports = fp(swagger);