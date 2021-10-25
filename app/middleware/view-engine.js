const nunjucks = require('nunjucks');
const path = require('path');

module.exports = (app) => {
  // view engine setup
  nunjucks.configure([
    path.resolve(__dirname, '../views'),
    path.resolve(__dirname, '../../node_modules/govuk-frontend/govuk/'),
    path.resolve(__dirname, '../../node_modules/govuk-frontend/govuk/components'),
  ], {
    autoescape: true,
    express: app,
  });
  app.set('view engine', 'njk');
};
