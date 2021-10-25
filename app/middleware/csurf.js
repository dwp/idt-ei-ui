const csurf = require('csurf');
const { findTimeoutPage } = require('./session-timeout');
const logger = require('../lib/logger')();

module.exports = [(req, res, next) => {
  if (req.method === 'POST' && !req.session.csrfSecret) {
    logger.error('csrf token missing in POST. Redirecting to session timeout');
    res.redirect(findTimeoutPage(req.originalUrl));
  } else {
    csurf()(req, res, next);
  }
}, (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
}];
