'use strict';

const fp = require('fastify-plugin');
const { join } = require('path');
const glob = require('glob');

class Routes {
  constructor(fastify) {
    this.fastify = fastify;
  }

  /**
   * Init defenition of the routes
   */
  start() {
    const dirs = glob.sync(this.fastify.config.routesDir + '/*');
    for (let a = 0; a < dirs.length; a++) {
      this.#defineRoutes(dirs[a]);
    }
  }

  /**
   * Define the routes placed in a directory
   */
  #defineRoutes(dir) {
    const Class = require(dir);
    const validators = require(join(dir, 'validators'));
    const instance = new Class();

    const methods = Object
      .getOwnPropertyNames(Class.prototype)
      .filter(method => method != 'constructor');
    
    for (let a = 0; a < methods.length; a++) {
      const metaData = methods[a];
      const [httpMethod, url, ...routeMiddlewares] = metaData
        .split(/[\s+\|,]/g)
        .filter(e => e.length > 0);
  
      const handler = instance[metaData];
      const routeData = {
        method: httpMethod,
        url: instance.prefix + url,
        handler
      };
      const schema = validators[`${httpMethod} ${url}`];
      if (schema instanceof Object) {
        routeData.schema = schema;
      }
  
      this.#setMiddlewares(routeMiddlewares, routeData);
      this.fastify.route(routeData);
    }
  }

  /**
   * Set list of middlewares for a route
   */
  #setMiddlewares(routeMiddlewares, routeData) {
    if (routeMiddlewares.length < 1) {
      return;
    }
    const result = [];
    for (let a = 0; a < routeMiddlewares.length; a++) {
      const name = routeMiddlewares[a];
      const middleware = this.fastify.middlewares[name];
      
      if (!(middleware instanceof Function)) {
        throw new Error(`The middleware "${name}" is not defined`);
      }
      result.push(middleware);
    }
    if (result.length > 0) {
      routeData.preHandler = result;
    }
  }
}

module.exports = fp(async function(fastify, options) {
  const routes = new Routes(fastify);
  routes.start();
});