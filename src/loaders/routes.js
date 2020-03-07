'use string'

const fp = require('fastify-plugin');
const glob = require('glob');

module.exports = fp(async function(fastify, options) {
  new Routes(fastify).build();
});

class Routes {
  constructor(fastify) {
    this.fastify = fastify;
  }

  build() {
    this.scanFiles();
    this.files.forEach(file => {
      const Class = require(file);
      const instance = new Class();
      this.iterateClassMethods(Class, instance);
    });
  }

  iterateClassMethods(Class, instance) {
    Object
      .getOwnPropertyNames(Class.prototype)
      .filter(m => m !== 'constructor')
      .forEach(routeParams => {
        
        const { prefix } = instance;
        let [httpMethod, url] = routeParams.split(': ');
        if (typeof prefix === 'string') {
          url = prefix + url;
        }
        const essential = instance[routeParams]();
        if (!(essential instanceof Object)) {
          return;
        }

        /**
         * Define schema
         */
        const schema = {};
        const { params, query, body, res, auth } = essential;

        if (params instanceof Object) {
          schema.params = this.getBlankValidator(params);
        }
        if (query instanceof Object) {
          schema.querystring = this.getBlankValidator(query);
          this.setRequired(schema.querystring);
        }
        if (body instanceof Object) {
          schema.body = this.getBlankValidator(body);
          this.setRequired(schema.body);
        }
        this.setResponse(schema, res);

        const result = {
          method: httpMethod,
          url,
          schema,
          handler: essential.h
        };
        if (auth) {
          result.preValidation = [this.fastify.authenticate];
        }
        this.fastify.route(result);
      });
  }

  getBlankValidator(properties) {
    return {
      type: 'object',
      properties
    };
  }

  setRequired(object) {
    const { properties } = object;
    if (properties.hasOwnProperty('Required')) {
      const required = properties.Required;
      delete properties.Required;
      object.required = required;
    }
  }

  setResponse(schema, res) {
    let properties = {
      ok: { type: 'boolean' }
    };
    if (res instanceof Object) {
      properties = { ...properties, ...res };
    }
    schema.response = {
      200: {
        type: 'object',
        properties
      },
      '4xx': {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          errors: {
            type: 'object',
            patternProperties: {
              "^[a-z0-9]+$": { type: 'string' }
            },
            maxProperties: 5
          },
          message: { type: 'string' }
        }
      },
      '5xx': {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          message: { type: 'string' }
        }
      }
    };
  }

  scanFiles() {
    this.files = glob.sync(this.fastify.config.routesDir + '/*.js');
  }
}