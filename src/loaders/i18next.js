'use strict';

const fp = require('fastify-plugin');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

module.exports = fp(async (fastify) => {
  const { localesDir } = fastify.config;

  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: localesDir + '/{{lng}}/{{ns}}.json',
        addPath: localesDir + '/{{lng}}/{{ns}}.missing.json'
      },
      fallbackLng: 'en',
      preload: ['en'],
      saveMissing: true
    });

  fastify.register(i18nextMiddleware.plugin, { i18next });
});