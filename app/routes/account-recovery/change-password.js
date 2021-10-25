const { validationResult } = require('express-validator');

const { accountRecoveryApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const buildRequestBody = require('../../lib/build-request-body');
const logger = require('../../lib/logger')();
const {
  validationErrors,
} = require('../../lib/validation');

// ===========Routes to update password (after entry of new email/mobile)==========
/**
 * Handles GET request for change-your-password view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getChangeYourPassword = async (req, res) => {
  res.render('account-recovery/change-your-password.njk');
};

/**
 * Handles POST request for user selecting choice on change your password view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postChangeYourPassword = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('account-recovery/change-your-password.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    const result = await accountRecoveryApi(req, requestBody);
    req.session.payload = result.data;

    if (result.data.successUrl === '/am/console') {
      res.redirect('/account-recovery/complete');
    } else if (hasPrompt(result, 'Create a password')) {
      res.redirect('/account-recovery/create-new-password');
    } else {
      logger.error('Expected prompt not received');
      res.status(500).render('errors/500.njk');
    }
  }
};

/**
 * Handles GET request for create-new-password view in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getCreateNewPassword = async (req, res) => {
  res.render('account-recovery/create-new-password.njk');
};

/**
 * Handles POST request for user entry of new mobile number in Account Recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postCreateNewPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('account-recovery/create-new-password.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    const result = await accountRecoveryApi(req, requestBody);

    req.session.payload = result.data;

    if (result.data.successUrl === '/am/console') {
      res.redirect('/account-recovery/complete');
    } else {
      logger.error('Expected prompt not received');
      res.status(500).render('errors/500.njk');
    }
  }
};

module.exports = {
  getChangeYourPassword,
  postChangeYourPassword,
  getCreateNewPassword,
  postCreateNewPassword,
};
