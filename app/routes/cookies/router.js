const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');

const {
  getCookies, postCookies, postCookiesBanner, postCookiesHideMessage,
} = require('.');

router.route('/')
  .get(errorCatcher(getCookies))
  .post(errorCatcher(postCookies));

router.route('/banner')
  .post(errorCatcher(postCookiesBanner));

router.route('/hide-message')
  .post(errorCatcher(postCookiesHideMessage));

module.exports = router;
