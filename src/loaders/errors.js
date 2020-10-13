'use string'

const fp = require('fastify-plugin');
const status = require('http-status');
const isProduction = process.env.NODE_ENV === 'production';

async function errors(fastify) {
  fastify.setErrorHandler((error, request, reply) => {

    let errors = [];
    let code, message, logging = false;
    /**
     * If an error was thrown by AJV validator
     */
    if (Array.isArray(error.validation)) {
      code = status.BAD_REQUEST;
      message = status[code];

      errors = error.validation.map(({ params, message, dataPath }) => {
        const field = dataPath.length > 0 ? dataPath : Object.values(params)[0];
        return {
          field: field.split('.').filter(e => e.length > 0)[0],
          message
        };
      });
    }
    /**
     * If an error was thrown by the Boom
     */
    else if (error.isBoom) {
      let { statusCode, message: json } = error.output.payload;
      try {
        json = JSON.parse(json);
      } catch {
        json = {};
      }
      errors = Object.keys(json).map(field => {
        return {
          field,
          message: json[field]
        };
      });
      code = statusCode;
      message = status[code];
    }
    /**
     * Unknown case
     */
    else if (error instanceof Error) {
      code = status.INTERNAL_SERVER_ERROR;
      message = isProduction ? status[code] : error.message;
      logging = true;
    }
    else {
      code = status.INTERNAL_SERVER_ERROR;
      logging = true;
    }
    if (logging) {
      fastify.log.error(error);
    }
    reply.code(code).send({
      code,
      message,
      errors
    });
  });
}

module.exports = fp(errors);