'use string'

const fp = require('fastify-plugin');

async function errors(fastify) {
  fastify.setErrorHandler(function (error, request, reply) {
    fastify.log.error(error);

    if (error instanceof Error) {
      const payload = {
        ok: false,
        errors
      };
      const { validation: ajvValidation } = error;

      /**
       * Boom's error
       */
      if (error.isBoom) {
        const { statusCode, message: msg } = error.output.payload;
        let message = null;
        try {
          payload.errors = JSON.parse(msg);
        } catch (err) {
          message = msg;
        }
        if (typeof message === 'string') {
          payload.message = message;
        }
        return reply.code(statusCode).send(payload);
      }
      /**
       * Ajv validation error
       */
      else if (Array.isArray(ajvValidation) && ajvValidation.length > 0) {
        ajvValidation.forEach(({ dataPath, message }) => {
          payload.errors[dataPath.slice(1)] = message;
        });
        return reply.code(400).send(payload);
      }
    }
    reply.code(500).send({
      ok: false,
      message: 'Unknown Server Error'
    });
  });
}

module.exports = fp(errors);