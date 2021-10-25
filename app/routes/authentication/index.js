const { check, validationResult } = require('express-validator');
const _ = require('lodash');
const logger = require('../../lib/logger')();
const buildRequestBody = require('../../lib/build-request-body');
const authErrors = require('../../lib/auth-errors');
const { authenticationApi } = require('../../lib/am-api');
const { validationErrors, createError } = require('../../lib/validation');
const { hasPrompt } = require('../../lib/callbacks');
const { completeAuthentication, sendToDownstreamService } = require('../../lib/oidc-utils');

const { getSignIn, postSignIn } = require('./sign-in');

const { getFullLockout, postFullLockout } = require('./lockout');

const authenticateProblem = (req, res) => res.status(500).render('errors/500.njk');

const getTemporaryLockout = async (req, res) => {
  res.render('authentication/temporary-lockout.njk', {
    signinLink: process.env.SIGNIN_LINK,
  });
};

const getStillTempLockedOut = async (req, res) => {
  res.render('authentication/still-temp-lockout.njk', {
    signinLink: process.env.SIGNIN_LINK,
  });
};

const getAuthVerifyMobile = async (req, res) => {
  res.render('authentication/verify-mobile.njk');
};

const messageNodeResponse = (req) => {
  const requestBody = req.session.payload;
  // Setting the callback value to 0 sends a positive response to the message node.
  requestBody.callbacks[1].input[0].value = 0;
  return authenticationApi(req, requestBody)
    .then((result) => {
      logger.debug(result.data);
      req.session.payload = result.data;
    }).catch((err) => {
      throw err;
    });
};

const postAuthVerifyMobile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('authentication/verify-mobile.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await authenticationApi(req, requestBody)
      .then(async (result) => {
        const messageNodeMessage = _.get(result, 'data.callbacks[0].output[0].value');
        const hasCallbacks = Boolean(result.data.callbacks);

        req.session.payload = result.data;

        const HTMLMessageNodeValue = _.get(result, 'data.callbacks[1].output[1].value')
          ? _.get(result, 'data.callbacks[1].output[1].value') : '';

        if (HTMLMessageNodeValue.includes('HTMLMessageNode')) {
          completeAuthentication(req, res, result);
        } else if (messageNodeMessage === 'resendExpiredOTP' || messageNodeMessage === 'failedOTPAttempt') {
          const messageNodeValueLookup = {
            failedOTPAttempt: 'common:errors.security-code.incorrect-security-code',
            resendExpiredOTP: 'common:errors.security-code.expired',
          };
          errors.errors.push(createError(req, messageNodeValueLookup[messageNodeMessage]));
          messageNodeResponse(req).then(() => {
            res.render('authentication/verify-mobile.njk', validationErrors(req, errors));
          });
        } else if (hasCallbacks && hasPrompt(result, 'First name')) {
          req.session.journey = 'authenticate';
          res.redirect('/authenticate/name');
        } else if (hasCallbacks && hasPrompt(result, 'Provide a journeyId?')) {
          req.session.journey = 'authenticate';
          res.redirect('/identity-verification/redirect');
        } else {
          throw new Error('Unexpected response from AM');
        }
      }).catch((err) => {
        if (authErrors.isAuthFailure(err)) {
          const failureUrl = _.get(err, 'response.data.detail.failureUrl');
          if (failureUrl === 'TEMP_LOCKOUT') {
            res.redirect('/authenticate/temporary-lockout-sms');
          } else if (failureUrl === 'FULL_LOCKOUT') {
            res.redirect('/authenticate/full-lockout');
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      });
  }
};

const getLastLogin = async (req, res) => {
  res.render('authentication/last-login.njk', {
    date: req.session.lastLogin.date,
    time: req.session.lastLogin.time,
  });
};

const postLastLogin = async (req, res) => {
  const continueLastLoginResponse = await authenticationApi(req, req.session.payload);
  sendToDownstreamService(req, res, continueLastLoginResponse);
};

const getTemporaryLockoutSMS = async (req, res) => {
  res.render('authentication/temporary-lockout-sms.njk', {
    signinLink: process.env.SIGNIN_LINK,
  });
};

const getAuthResendMobile = async (req, res) => {
  res.render('authentication/resend-mobile-number.njk');
};

// =========User is on wrong page, has to start again=====
const getAuthStartAgain = async (req, res) => {
  res.render('authentication/start-again.njk');
};

const postAuthStartAgain = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

const postAuthResendMobile = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const result = await authenticationApi(req, requestBody);
  req.session.payload = result.data;
  res.redirect('/authenticate/verify-mobile');
};

// =========Session timeout, user has to start again=====
const getAuthenticateSessionTimeout = async (req, res) => {
  res.render('authentication/session-timeout.njk');
};

const postAuthenticateSessionTimeout = async (req, res) => {
  req.session.destroy(() => {
    res.redirect(process.env.SIGNIN_LINK);
  });
};

const signInValidationRules = [
  check('callbacks[0]').trim().notEmpty()
    .withMessage((value, { req, location, path }) => req.t('auth-sign-in:email.empty', { value, location, path }))
    .customSanitizer((value) => value.toLowerCase().replace(/\s+/g, '')),
  check('callbacks[1]').notEmpty()
    .withMessage((value, { req, location, path }) => req.t('auth-sign-in:password.empty', { value, location, path }))];

module.exports = {
  authenticateProblem,
  getSignIn,
  postSignIn,
  getAuthVerifyMobile,
  postAuthVerifyMobile,
  getTemporaryLockout,
  getFullLockout,
  postFullLockout,
  getStillTempLockedOut,
  getTemporaryLockoutSMS,
  getAuthResendMobile,
  getAuthStartAgain,
  postAuthStartAgain,
  postAuthResendMobile,
  signInValidationRules,
  getAuthenticateSessionTimeout,
  postAuthenticateSessionTimeout,
  getLastLogin,
  postLastLogin,
};
