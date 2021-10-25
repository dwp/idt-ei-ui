const { accountRecoveryApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const buildRequestBody = require('../../lib/build-request-body');
const {
  accountRecoveryPostHandler,
  accountRecoveryOTPPost,
} = require('./generic');
const logger = require('../../lib/logger')();

// ===========Post Findr call in 'Have access to email' journey - user enters new mobile==========
/**
 * Handles GET request for new-mobile-number view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getNewMobileNumber = async (req, res) => {
  res.render('account-recovery/new-mobile-number.njk');
};

/**
 * Handles POST request for user entry of new mobile number in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postNewMobileNumber = async (req, res) => {
  await accountRecoveryPostHandler(req, res, 'new-mobile-number', 'Security code', 'verify-new-mobile-number');
};

/**
 * Handles GET request for verify-mobile view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getVerifyNewMobileNumber = async (req, res) => {
  res.render('account-recovery/verify-mobile.njk', {
    resendSMSLink: '/account-recovery/resend-new-sms-code',
  });
};

/**
 * Handles GET request for resend-new-sms-code view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getARResendNewSMSCode = async (req, res) => {
  res.render('account-recovery/resend-sms-code.njk', {
    enterMobileLink: '/account-recovery/reenter-new-mobile-number',
  });
};

/**
 * Handles POST request for resend-new-sms-code view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postARResendNewSMSCode = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const result = await accountRecoveryApi(req, requestBody);

  if (hasPrompt(result, 'Security code')) {
    req.session.payload = result.data;
    return res.redirect('/account-recovery/verify-new-mobile-number');
  }

  logger.error('Security code prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

/**
 * Handles GET request for reenter-new-mobile-number link in Account Recovery.
 * User needs to reenter new mobile number.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getARReenterNewMobileNumber = async (req, res) => {
  req.body.callbacks = ['reenter'];
  const requestBody = buildRequestBody(req);
  const result = await accountRecoveryApi(req, requestBody);

  if (hasPrompt(result, 'Mobile number')) {
    req.session.payload = result.data;
    return res.redirect('/account-recovery/new-mobile-number');
  }

  logger.error('Mobile number prompt expected but not received');
  return res.status(500).render('errors/500.njk');
};

/**
 * Handles POST request for user entry of new mobile number in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postVerifyNewMobileNumber = async (req, res) => {
  await accountRecoveryOTPPost(req, res, 'account-recovery/verify-mobile', 'Change password', '/account-recovery/change-your-password');
};

module.exports = {
  getNewMobileNumber,
  postNewMobileNumber,
  getVerifyNewMobileNumber,
  getARResendNewSMSCode,
  postARResendNewSMSCode,
  getARReenterNewMobileNumber,
  postVerifyNewMobileNumber,
};
