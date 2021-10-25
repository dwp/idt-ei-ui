const { accountRecoveryApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const buildRequestBody = require('../../lib/build-request-body');
const {
  accountRecoveryPostHandler,
  accountRecoveryOTPPost,
} = require('./generic');
const logger = require('../../lib/logger')();

/**
 * Handles GET request for landing page in Account Recovery (Update Mobile journey).
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getStartUpdateMobile = async (req, res) => {
  req.session.journey = 'account-recovery';
  res.render('account-recovery/start-update-mobile.njk');
};

/**
 * Handles POST request for landing page in Account Recovery (Update Mobile journey).
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postStartUpdateMobile = async (req, res) => {
  const result = await accountRecoveryApi(req);

  if (hasPrompt(result, 'User Name')) {
    req.session.payload = result.data;
    return res.redirect('/account-recovery/email-address');
  }

  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

/**
 * Handles GET request for email-address view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getAREmailAddress = async (req, res) => {
  res.render('account-recovery/email-address.njk');
};

/**
 * Handles POST request for user entry of email address in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postAREmailAddress = async (req, res) => {
  await accountRecoveryPostHandler(req, res, 'email-address', 'Security code', 'verify-email');
};

/**
 * Handles GET request for verify-email view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getARVerifyEmail = async (req, res) => {
  res.render('account-recovery/verify-email.njk', {
    resendEmailLink: '/account-recovery/resend-email-code',
  });
};

/**
 * Handles POST request for user entry of email security code in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postARVerifyEmail = async (req, res) => {
  await accountRecoveryOTPPost(req, res, 'account-recovery/verify-email', 'First name', '/account-recovery/name');
};

/**
 * Handles GET request for resend-email-code view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getARResendEmailCode = async (req, res) => {
  res.render('account-recovery/resend-email-code.njk', {
    enterEmailLink: '/account-recovery/reenter-email-address',
  });
};

/**
 * Handles POST request for resend-sms-code view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postARResendEmailCode = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const result = await accountRecoveryApi(req, requestBody);

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/account-recovery/verify-email');
  }

  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

/**
 * Handles GET request for reenter-email-address view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getARReenterEmailAddress = async (req, res) => {
  req.body = {
    callbacks: ['reenter'],
  };
  const requestBody = buildRequestBody(req);
  const result = await accountRecoveryApi(req, requestBody);

  if (hasPrompt(result, 'User Name')) {
    req.session.payload = result.data;
    return res.redirect('/account-recovery/email-address');
  }

  logger.error('Email address prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

/**
 * Handles GET request for email-not-registered view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getAREmailNotRegistered = async (req, res) => {
  res.render('common/not-registered.njk', {
    signinLink: process.env.SIGNIN_LINK,
    registrationLink: '/register',
  });
};

module.exports = {
  getStartUpdateMobile,
  postStartUpdateMobile,
  getAREmailAddress,
  postAREmailAddress,
  getARVerifyEmail,
  postARVerifyEmail,
  getARResendEmailCode,
  postARResendEmailCode,
  getARReenterEmailAddress,
  getAREmailNotRegistered,
};
