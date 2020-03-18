'use string'

const { promisify } = require('util');
const fp = require('fastify-plugin');
const WebSocketPackage = require('ws');

class WebSocket {
  constructor({ config, jwt }) {
    this.config = config;
    this.jwt = jwt;

    const options = {
      ...this.config.websocket,
      ...{ verifyClient: this.verifyClient.bind(this) }
    };
    this.server = new WebSocketPackage.Server(options);
    this.clients = {};
  }

  /**
   * Awaiting connection of a client
   */
  start() {
    this.server.on('connection', (client, req) => {
      const { _id: userId, name } = req.user;
      this.clients[userId] = client;
      console.log(`User "${name}, id: ${userId}" connected`);

      client.on('close', () => {
        delete this.clients[userId];
      });
    });
  }

  /**
   * The analogue of "handshake" method
   */
  verifyClient({ req }, next) {
    const { url } = req;
    const token = url.split('?token=')[1];

    promisify(this.jwt.verify)(token, this.config.jwt.secret)
      .then(decoded => {
        req.user = decoded;
        next(true);
      })
      .catch(() => {
        next(false);
      });
  }
}

async function websocket(fastify, options) {
  const instance = new WebSocket(fastify);
  instance.start();
}

module.exports = fp(websocket);