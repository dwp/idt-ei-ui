const fs = require('fs');
const path = require('path');
const i18next = require('i18next');
const i18nMiddleware = require('i18next-http-middleware');
const FSBackend = require('i18next-fs-backend');

module.exports = (app) => {
  i18next.use(FSBackend)
    .use(i18nMiddleware.LanguageDetector)
    .init({
      debug: false,
      ns: fs.readdirSync(path.resolve(__dirname, '../locales/en')).map((f) => path.parse(f).name),
      backend: {
        loadPath: `${__dirname}/../locales/{{lng}}/{{ns}}.json`,
      },
      initImmediate: false,
      detection: {
        // order and from where user language should be detected
        order: ['querystring', 'cookie', 'header'],

        // keys or params to lookup language from
        lookupQuerystring: 'lng',
        lookupCookie: 'lng',
        lookupHeader: 'accept-language',
        lookupSession: 'lng',
        // cache user language
        caches: ['cookie'],
      },
      preload: ['en', 'cy'],
      fallbackLng: 'en',
    });
  app.use(
    i18nMiddleware.handle(i18next, {
      ignoreRoutes: ['/public'],
    }),
  );
};
