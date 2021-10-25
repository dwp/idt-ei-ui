const get = require('lodash/get');
const { validationResult } = require('express-validator');

const { validationErrors, createError } = require('../../lib/validation');
const { hasPrompt } = require('../../lib/callbacks');
const { passwordResetApi } = require('../../lib/am-api');
const buildRequestBody = require('../../lib/build-request-body');
const authErrors = require('../../lib/auth-errors');
const logger = require('../../lib/logger')();

// redirect to signin service if password has already been reset
const passwordResetCheckIfPasswordAlreadyReset = (req, res, next) => {
  if (
    req.method === 'GET'
    && req.url !== '/' && req.url !== '/start-again' && req.url !== '/success'
    && req.session.passwordAlreadyReset) {
    res.redirect(process.env.SIGNIN_LINK);
  } else {
    next();
  }
};

const messageNodeResponse = (req) => {
  const requestBody = req.session.payload;
  // Setting the callback value to 0 sends a positive response to the message node.
  requestBody.callbacks[1].input[0].value = 0;
  return passwordResetApi(req, requestBody)
    .then((result) => {
      logger.debug(result.data);
      req.session.payload = result.data;
    }).catch((err) => {
      throw err;
    });
};

// internal function for POSTs which sent the One Time Password entered by user
// (See postPasswordResetVerifyEmail and postPasswordResetVerifyMobile below)
const passwordResetPostVerifyOTP = async (
  req,
  res,
  currentPage,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.currentPage = currentPage;
    res.render(`${currentPage}.njk`, validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await passwordResetApi(req, requestBody)
      .then(async (result) => {
        const messageNodeMessage = get(result, 'data.callbacks[0].output[0].value');
        req.session.payload = result.data;
        if (messageNodeMessage === 'resendExpiredOTP' || messageNodeMessage === 'failedOTPAttempt') {
          const messageNodeValueLookup = {
            failedOTPAttempt: 'common:errors.security-code.incorrect-security-code',
            resendExpiredOTP: 'common:errors.security-code.expired',
          };
          errors.errors.push(createError(req, messageNodeValueLookup[messageNodeMessage]));
          await messageNodeResponse(req).then(() => {
            res.render(`${currentPage}.njk`, validationErrors(req, errors));
          });
        } else if (hasPrompt(result, 'Security code')) {
          res.redirect('/password-reset/verify-mobile');
        } else if (hasPrompt(result, 'Create a password')) {
          res.redirect('/password-reset/new-password');
        } else {
          logger.error('Prompt Security code or Create a password expected but not received');
          res.status(500).render('errors/500.njk');
        }
      }).catch((err) => {
        if (authErrors.isAuthFailure(err)) {
          const failureUrl = get(err, 'response.data.detail.failureUrl');
          if (failureUrl === 'TEMP_LOCKOUT') {
            res.redirect('/password-reset/temporary-lockout');
          } else if (failureUrl === 'SMS_NOT_SENT') {
            logger.error('Error sending SMS with security code');
            res.redirect('/password-reset/problem');
          } else if (failureUrl === 'EMAIL_NOT_REGISTERED') {
            res.redirect('/password-reset/email-not-registered');
          } else if (failureUrl === 'PASSWORD_CHANGED_RECENTLY') {
            res.redirect('/password-reset/password-changed-recently');
          } else if (failureUrl === 'STILL_TEMP_LOCKOUT') {
            res.redirect('/password-reset/still-locked-out');
          } else {
            logger.error(err);
            throw err;
          }
        } else {
          logger.error(err);
          throw err;
        }
      });
  }
};

const getPasswordResetLanding = async (req, res) => {
  req.session.journey = 'password-reset';
  req.session.passwordAlreadyReset = false;
  res.render('password-reset/landing.njk');
};

const postPasswordResetLanding = async (req, res) => {
  res.redirect('/password-reset/email-address');
};

const getPasswordResetEmail = async (req, res) => {
  const result = await passwordResetApi(req);

  if (hasPrompt(result, 'User Name')) {
    req.session.payload = result.data;
    return res.render('password-reset/email-address.njk');
  }
  logger.error('User Name prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

const postPasswordResetEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('password-reset/email-address.njk', validationErrors(req, errors));
  }

  const requestBody = buildRequestBody(req);

  let result;
  try {
    result = await passwordResetApi(req, requestBody);
  } catch (err) {
    if (get(err, 'response.data.detail.failureUrl') === 'ERROR_SENDING_EMAIL') {
      logger.error('Error sending email with security code');
      return res.redirect('/password-reset/problem');
    }
    throw err;
  }

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/password-reset/verify-email');
  }
  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

const getPasswordResetVerifyEmail = async (req, res) => res.render('password-reset/verify-email.njk');

const postPasswordResetVerifyEmail = async (req, res) => {
  await passwordResetPostVerifyOTP(req, res, 'password-reset/verify-email');
};

const getPasswordResetResendEmail = async (req, res) => res.render('password-reset/resend-email.njk');

const postPasswordResetResendEmail = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const result = await passwordResetApi(req, requestBody);

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/password-reset/verify-email');
  }

  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

const getPasswordResetEmailNotRegistered = (req, res) => res.render('common/not-registered.njk', {
  signinLink: process.env.SIGNIN_LINK,
  registrationLink: '/register',
});

const getPasswordResetVerifyMobile = async (req, res) => res.render('password-reset/verify-mobile.njk');

const postPasswordResetVerifyMobile = async (req, res) => {
  await passwordResetPostVerifyOTP(req, res, 'password-reset/verify-mobile');
};

const getPasswordResetNewSMS = async (req, res) => res.render('password-reset/resend-mobile.njk');

const postPasswordResetNewSMS = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const result = await passwordResetApi(req, requestBody);

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/password-reset/verify-mobile');
  }

  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

const getPasswordResetReenterEmailAddress = async (req, res) => res.redirect('/password-reset/email-address');

const getPasswordResetPasswordChangedRecently = (req, res) => res.render('password-reset/password-changed-recently.njk');

const getPasswordResetNewPassword = async (req, res) => res.render('password-reset/new-password.njk');

const postPasswordResetNewPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('password-reset/new-password.njk', validationErrors(req, errors));
  }

  const requestBody = buildRequestBody(req);
  let result;
  try {
    result = await passwordResetApi(req, requestBody);
  } catch (err) {
    if (get(err, 'response.data.detail.failureUrl') === 'ERROR_SENDING_EMAIL') {
      logger.error('Error sending email with security code');
      return res.redirect('/password-reset/problem');
    }
    throw err;
  }
  const { data: { successUrl: responseUrl } } = result;

  const successUrl = '/am/console';

  if (responseUrl === successUrl) {
    return res.redirect('/password-reset/success');
  }

  logger.error('success url not received and errors not caught');
  return res.status(500).render('errors/500.njk');
};

const getPasswordResetSuccess = async (req, res) => {
  req.session.passwordAlreadyReset = true;
  return res.render('password-reset/success.njk');
};

const postPasswordResetSuccess = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

const getPasswordResetStartAgain = async (req, res) => {
  res.render('password-reset/start-again.njk');
};

const postPasswordResetStartAgain = async (req, res) => {
  res.redirect('/password-reset');
};

const getPasswordResetSessionTimeout = async (req, res) => {
  delete req.session.startJourneyTimeStamp;
  res.render('password-reset/session-timeout.njk');
};

const postPasswordResetSessionTimeout = async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/password-reset');
  });
};

const getPasswordResetProblem = (req, res) => res.status(500).render('errors/500.njk');

const getResetTemporaryLockout = async (req, res) => {
  res.render('password-reset/temporary-lockout.njk', {
    passwordResetPath: process.env.PASSWORD_RESET_PATH,
  });
};

const getResetStillLockedOut = async (req, res) => {
  res.render('password-reset/still-locked-out.njk', {
    passwordResetPath: process.env.PASSWORD_RESET_PATH,
  });
};

module.exports = {
  passwordResetCheckIfPasswordAlreadyReset,
  getPasswordResetLanding,
  postPasswordResetLanding,
  getPasswordResetEmail,
  postPasswordResetEmail,
  getPasswordResetVerifyEmail,
  postPasswordResetVerifyEmail,
  getPasswordResetResendEmail,
  postPasswordResetResendEmail,
  getPasswordResetEmailNotRegistered,
  getPasswordResetVerifyMobile,
  postPasswordResetVerifyMobile,
  getPasswordResetNewSMS,
  postPasswordResetNewSMS,
  getPasswordResetReenterEmailAddress,
  getPasswordResetPasswordChangedRecently,
  getPasswordResetNewPassword,
  postPasswordResetNewPassword,
  getPasswordResetSuccess,
  postPasswordResetSuccess,
  getPasswordResetStartAgain,
  postPasswordResetStartAgain,
  getPasswordResetSessionTimeout,
  postPasswordResetSessionTimeout,
  getPasswordResetProblem,
  getResetTemporaryLockout,
  getResetStillLockedOut,
};
