'use string'

const fp = require('fastify-plugin');

async function errors(fastify) {
  fastify.setErrorHandler(function (error, request, reply) {
    fastify.log.error(error);

    if (error instanceof Error) {
      if (error.isBoom) {
        const { statusCode, message: msg } = error.output.payload;
        let errors = {};
        let message = null;
        try {
          errors = JSON.parse(msg);
        } catch {
          message = msg;
        }

        const payload = {
          ok: false,
          errors
        };
        if (typeof message === 'string') {
          payload.message = message;
        }
        return reply.code(statusCode).send(payload);
      }
    }
    reply.code(500).send({
      ok: false,
      message: 'Unknown Server Error'
    });
  });
}

module.exports = fp(errors);