const { validationResult } = require('express-validator');
const _ = require('lodash');

const createError = require('http-errors');

const logger = require('../../lib/logger')();
const buildRequestBody = require('../../lib/build-request-body');
const { validationErrors } = require('../../lib/validation');
const { authenticationApi, accountRecoveryApi } = require('../../lib/am-api');
const { hasPrompt } = require('../../lib/callbacks');
const authErrors = require('../../lib/auth-errors');

const getFindrName = async (req, res) => {
  res.render('findr/name.njk');
};

const postFindrName = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('findr/name.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    const apiFunction = req.session.journey === 'authenticate'
      ? authenticationApi : accountRecoveryApi;
    const result = await apiFunction(req, requestBody);

    if (hasPrompt(result, 'Day')) {
      req.session.payload = result.data;
      res.redirect(`/${req.session.journey}/date-of-birth`);
    } else {
      next(createError(500, 'Day prompt expected but not received'));
    }
  }
};

const getFindrDOB = async (req, res) => {
  res.render('findr/date-of-birth.njk');
};

const postFindrDOB = async (req, res, next) => {
  const errors = validationResult(req);

  const { day, month, year } = req.body;
  const { dateErrors } = req;

  if (!errors.isEmpty()) {
    res.render(
      'findr/date-of-birth.njk', {
        ...validationErrors(req, errors), day, month, year, dateErrors,
      },
    );
  } else {
    const requestBody = buildRequestBody(req);

    const apiFunction = req.session.journey === 'authenticate'
      ? authenticationApi : accountRecoveryApi;
    const result = await apiFunction(req, requestBody);

    if (hasPrompt(result, 'Postcode')) {
      req.session.payload = result.data;
      res.redirect(`/${req.session.journey}/postcode`);
    } else {
      next(createError(500, 'Postcode prompt expected but not received'));
    }
  }
};

const getFindrPostcode = async (req, res) => {
  res.render('findr/postcode.njk');
};

const postFindrPostcode = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('findr/postcode.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);

    try {
      const apiFunction = req.session.journey === 'authenticate'
        ? authenticationApi : accountRecoveryApi;
      const result = await apiFunction(req, requestBody);

      const expectedPrompt = req.session.journey === 'authenticate'
        ? 'Provide a journeyId?' : 'Mobile number';
      if (hasPrompt(result, expectedPrompt)) {
        req.session.payload = result.data;
        const redirectRoute = req.session.journey === 'authenticate'
          ? '/identity-verification/redirect' : '/account-recovery/new-mobile-number';
        res.redirect(redirectRoute);
      } else {
        logger.error(`Expected prompt ${expectedPrompt} not received`);
        next(createError(500));
      }
    } catch (err) {
      if (authErrors.isAuthFailure(err)) {
        const failureUrl = _.get(err, 'response.data.detail.failureUrl');
        if (failureUrl === 'FINDR_RECORD_NOT_FOUND') {
          res.redirect(`/${req.session.journey}/not-found`);
        } else if (
          failureUrl === 'FINDR_MORE_INFO_REQUIRED'
          || failureUrl === 'GUIDS_DO_NOT_MATCH'
        ) {
          res.redirect(`/${req.session.journey}/could-not-sign-in`);
        } else {
          logger.error(`Failure URL ${failureUrl} not recognised`);
          throw err;
        }
      } else {
        throw err;
      }
    }
  }
};

const getFindrNotFound = async (req, res) => {
  const serviceSupportInstructions = req.t(
    `configurable-text:${process.env.SERVICE}-support-instructions`,
  );
  res.render('findr/not-found.njk', { serviceSupportInstructions });
};

const postFindrNotFound = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

const getFindrCouldNotSignIn = async (req, res) => {
  const serviceSupportInstructions = req.t(
    `configurable-text:${process.env.SERVICE}-support-instructions`,
  );
  const serviceSupportButtonText = req.t(
    `configurable-text:${process.env.SERVICE}-support-button-text`,
  );

  res.render('findr/could-not-sign-in.njk', {
    serviceSupportInstructions, serviceSupportButtonText,
  });
};

const postFindrCouldNotSignIn = async (req, res) => {
  res.redirect(process.env.SERVICE_SUPPORT_BUTTON_URL);
};

module.exports = {
  getFindrName,
  postFindrName,
  getFindrDOB,
  postFindrDOB,
  getFindrPostcode,
  postFindrPostcode,
  getFindrNotFound,
  postFindrNotFound,
  getFindrCouldNotSignIn,
  postFindrCouldNotSignIn,
};
