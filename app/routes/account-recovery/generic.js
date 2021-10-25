const { validationResult } = require('express-validator');
const get = require('lodash/get');

const {
  validationErrors, createError,
} = require('../../lib/validation');
const buildRequestBody = require('../../lib/build-request-body');
const { accountRecoveryApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const authErrors = require('../../lib/auth-errors');
const logger = require('../../lib/logger')();

/**
 * Generic function for handling POST requests in account recovery journey.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @param {string} currentPage The view to render again if there are errors.
 * @param {string} expectedPrompt The prompt expected to be requested by ForgeRock.
 * @param {string} redirectPage The page to redirect to if all ok.
 * @returns {undefined}
 */
const accountRecoveryPostHandler = async (
  req,
  res,
  currentPage,
  expectedPrompt,
  redirectPage,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render(`account-recovery/${currentPage}.njk`, validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    const result = await accountRecoveryApi(req, requestBody);
    if (hasPrompt(result, expectedPrompt)) {
      req.session.payload = result.data;
      res.redirect(`/account-recovery/${redirectPage}`);
    } else {
      logger.error(`${expectedPrompt} prompt expected but not received`);
      res.status(500).render('errors/500.njk');
    }
  }
};

/**
 * Checks for message node prompt in ForgeRock.
 *
 * @param {object} req The Request.
 * @returns {undefined}
 */
const messageNodeResponse = (req) => {
  const requestBody = req.session.payload;
  // Setting the callback value to 0 sends a positive response to the message node.
  requestBody.callbacks[1].input[0].value = 0;
  return accountRecoveryApi(req, requestBody)
    .then((result) => {
      logger.debug(result.data);
      req.session.payload = result.data;
    }).catch((err) => {
      throw err;
    });
};

/**
 * Handles post requests for OTP entries.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @param {string} currentPage The page to render again if there are errors.
 * @param {string} expectedPrompt The prompt expected to be requested by ForgeRock.
 * @param {string} redirectPage The page to redirect to if all ok.
 * @returns {undefined}
 * @throws {object} Throws any unhandled errors.
 */
const accountRecoveryOTPPost = async (
  req,
  res,
  currentPage,
  expectedPrompt,
  redirectPage,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render(`${currentPage}.njk`, validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await accountRecoveryApi(req, requestBody)
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
        } else if (hasPrompt(result, expectedPrompt)) {
          res.redirect(redirectPage);
          req.session.journey = 'account-recovery';
        } else {
          logger.error(`${expectedPrompt} prompt expected but not received`);
          res.status(500).render('errors/500.njk');
        }
      }).catch((err) => {
        if (authErrors.isAuthFailure(err)) {
          const failureUrl = get(err, 'response.data.detail.failureUrl');
          if (failureUrl === 'TEMP_LOCKOUT') {
            res.redirect('/account-recovery/temporary-lockout');
          } else if (failureUrl === 'STILL_TEMP_LOCKOUT') {
            res.redirect('/account-recovery/still-temporary-lockout');
          } else if (failureUrl === 'EMAIL_NOT_REGISTERED') {
            res.redirect('/account-recovery/email-not-registered');
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      });
  }
};

module.exports = {
  accountRecoveryPostHandler,
  accountRecoveryOTPPost,
};
