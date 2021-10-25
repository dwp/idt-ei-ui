const { validationResult } = require('express-validator');
const _ = require('lodash');
const buildRequestBody = require('../../lib/build-request-body');
const { authenticationApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const {
  validationErrors,
  accountExistsError,
} = require('../../lib/validation');
const {
  setTransientError,
  getTransientError,
} = require('../../lib/transient-error');
const logger = require('../../lib/logger')();

/* Initiate Authentication flow */

const getSignIn = async (req, res) => {
  const transientError = getTransientError(req);

  if (!transientError) {
    const result = await authenticationApi(req);
    logger.debug(result.data);
    req.session.payload = result.data;
  }

  if (req.query.goto) {
    req.session.goto = req.query.goto;
  }

  req.session.journey = 'authenticate';

  res.render('authentication/sign-in.njk', transientError);
};

const postSignIn = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    setTransientError(req, validationErrors(req, errors));
    return res.redirect('/authenticate');
  }

  const requestBody = buildRequestBody(req);

  let result;

  try {
    result = await authenticationApi(req, requestBody);
  } catch (err) {
    const failureUrl = _.get(err, 'response.data.detail.failureUrl');
    if (failureUrl === 'NO_MATCH1' || failureUrl === 'NOT_FOUND') {
      setTransientError(req, accountExistsError(req, {
        param: 'register',
        msg: req.t('auth-sign-in:invalid.register'),
      }));
      return res.redirect('/authenticate');
    }
    if (failureUrl === 'NO_MATCH2') {
      setTransientError(req, accountExistsError(req, {
        param: 'callbacks[0]',
        msg: req.t('auth-sign-in:invalid.warning'),
      }));
      return res.redirect('/authenticate');
    }
    if (failureUrl === 'TEMP_LOCKOUT') {
      return res.redirect('/authenticate/temporary-lockout');
    }
    if (failureUrl === 'FULL_LOCKOUT' || failureUrl === 'STILL_FULL_LOCKOUT') {
      return res.redirect('/authenticate/full-lockout');
    }
    if (failureUrl === 'STILL_TEMP_LOCKOUT') {
      return res.redirect('/authenticate/still-temp-lockout');
    }
    logger.error(`Unexpected authenticate failureUrl: "${failureUrl}"`);
    throw err;
  }

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/authenticate/verify-mobile');
  }

  if (hasPrompt(result, 'Enter Mobile Number')) {
    req.session.payload = result.data;
    return res.redirect('/register/resume-registration');
  }

  logger.error('Security Code prompt expected but not received');
  return res.redirect('/authenticate/problem');
};

module.exports = {
  getSignIn,
  postSignIn,
};
