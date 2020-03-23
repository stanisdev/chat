'use string'

const fp = require('fastify-plugin');

async function websocket(fastify, options) {
  fastify.serviceWebsocket.start();
}

module.exports = fp(websocket);