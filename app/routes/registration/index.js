const { validationResult } = require('express-validator');
const _ = require('lodash');

const { registrationApi } = require('../../lib/am-api');
const buildRequestBody = require('../../lib/build-request-body');
const { validationErrors, createError } = require('../../lib/validation');
const authErrors = require('../../lib/auth-errors');
const logger = require('../../lib/logger')();

const handleAuthFailureError = (err, failureUrl, res, req) => {
  if (failureUrl === 'EMAIL_ALREADY_REGISTERED') {
    res.redirect('/register/email-already-registered');
  } else if (failureUrl === 'OTP_EXPIRED') {
    req.session.destroy(() => {
      res.redirect('/register/start-again-expired-otp');
    });
  } else if (failureUrl === 'OTP_INCORRECT') {
    if (req.session.previousPage === '/verify-mobile') {
      res.redirect('/register/add-mobile-when-sign-in');
    } else {
      req.session.destroy(() => {
        res.redirect('/register/start-again-incorrect-otp');
      });
    }
  } else if (failureUrl === 'TEMP_LOCKOUT') {
    res.redirect('/authenticate/temporary-lockout-sms');
  } else if (failureUrl === 'FULL_LOCKOUT') {
    res.redirect('/authenticate/full-lockout');
  } else {
    logger.error(err);
    throw err;
  }
};

const getLanding = async (req, res) => {
  req.session.journey = 'register';
  res.render('registration/landing');
};

const postLanding = async (req, res) => {
  res.redirect('/register/email');
};

const getEmail = async (req, res) => {
  const { data } = await registrationApi(req);
  logger.debug(data);
  req.session.payload = data;
  res.render('registration/email-address.njk');
};

const postEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('registration/email-address.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await registrationApi(req, requestBody)
      .then(({ data }) => {
        req.session.payload = data;
        // eslint-disable-next-line prefer-destructuring
        req.session.email = req.body.callbacks[0];
        res.redirect('/register/verify-email');
      }).catch((err) => {
        if (err.response.data.detail.failureUrl !== 'ERROR_SENDING_EMAIL') {
          logger.error(err);
        }
        throw err;
      });
  }
};

const getResendEmail = async (req, res) => {
  res.render('registration/resend-email-address.njk');
};

const postResendEmail = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const { data } = await registrationApi(req, requestBody);

  req.session.payload = data;

  // eslint-disable-next-line prefer-destructuring
  req.session.email = req.body.callbacks[0];
  res.redirect('/register/verify-email');
};

const getVerifyEmail = async (req, res) => {
  res.render('registration/verify-email.njk', {
    email: req.session.email,
  });
};

const messageNodeResponse = (req) => {
  const requestBody = req.session.payload;
  // Setting the callback value to 0 sends a positive response to the message node.
  requestBody.callbacks[1].input[0].value = 0;
  return registrationApi(req, requestBody)
    .then((result) => {
      logger.debug(result.data);
      req.session.payload = result.data;
    }).catch((err) => {
      throw err;
    });
};
const postOTP = async (req, res, targetPage, currentTemplate) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render(currentTemplate, validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await registrationApi(req, requestBody)
      .then(async (result) => {
        req.session.payload = result.data;
        const messageNodeMessage = _.get(result, 'data.callbacks[0].output[0].value');
        if (messageNodeMessage === 'resendExpiredOTP' || messageNodeMessage === 'failedOTPAttempt') {
          const messageNodeValueLookup = {
            failedOTPAttempt: 'common:errors.security-code.incorrect-security-code',
            resendExpiredOTP: 'common:errors.security-code.expired',
          };
          errors.errors.push(createError(req, messageNodeValueLookup[messageNodeMessage]));
          await messageNodeResponse(req).then(() => {
            res.render(currentTemplate, validationErrors(req, errors));
          });
        } else {
          logger.debug(result.data);
          req.session.payload = result.data;
          res.redirect(targetPage);
        }
      }).catch((err) => {
        if (authErrors.isAuthFailure(err)) {
          const failureUrl = _.get(err, 'response.data.detail.failureUrl');
          handleAuthFailureError(err, failureUrl, res, req);
        } else {
          logger.error(err);
          throw err;
        }
      });
  }
};

const postVerifyEmail = async (req, res) => {
  await postOTP(
    req,
    res,
    '/register/password',
    'registration/verify-email.njk',
  );
};

const getEmailAlreadyRegistered = async (req, res) => {
  res.render('registration/email-already-registered.njk', {
    passwordResetPath: process.env.PASSWORD_RESET_PATH,
    signinLink: process.env.SIGNIN_LINK,
  });
};

const getCreatePassword = async (req, res) => {
  res.render('registration/password.njk');
};

const postCreatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('registration/password.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    const result = await registrationApi(req, requestBody);
    logger.debug(result.data);
    req.session.payload = result.data;
    res.redirect('/register/mobile');
  }
};

const getMobile = async (req, res) => {
  res.render('registration/mobile.njk');
};

const postMobile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('registration/mobile.njk', validationErrors(req, errors));
  } else {
    const requestBody = buildRequestBody(req);
    await registrationApi(req, requestBody)
      .then((result) => {
        logger.debug(result.data);
        req.session.payload = result.data;
        res.redirect('/register/verify-mobile');
      }).catch((err) => {
        if (err.response.data.detail.failureUrl === 'ERROR_SENDING_SMS') {
          throw err;
        } else if (authErrors.isAuthFailure(err)) {
          res.redirect('/register/verify-mobile');
        }
      });
  }
};

const getVerifyMobile = async (req, res) => {
  res.render('registration/verify-mobile.njk');
};

const postVerifyMobile = async (req, res) => {
  await postOTP(
    req,
    res,
    '/register/complete',
    'registration/verify-mobile.njk',
  );
};

const getResendMobile = async (req, res) => {
  res.render('registration/resend-mobile-number.njk');
};

const postResendMobile = async (req, res) => {
  const requestBody = buildRequestBody(req);
  const { data } = await registrationApi(req, requestBody);
  req.session.payload = data;
  res.redirect('/register/verify-mobile');
};

const getComplete = async (req, res) => {
  res.render('registration/complete.njk');
};

const postComplete = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

const getReEnterEmail = async (req, res) => {
  req.body.callbacks = ['reenter'];
  const requestBody = buildRequestBody(req);
  const result = await registrationApi(req, requestBody);
  req.session.payload = result.data;
  res.redirect('/register/email');
};

const postReEnterEmail = async (req, res) => {
  res.redirect('/register/verify-email');
};

const getReEnterMobile = async (req, res) => {
  req.body.callbacks = ['reenter'];
  const requestBody = buildRequestBody(req);
  const result = await registrationApi(req, requestBody);
  req.session.payload = result.data;
  res.redirect('/register/mobile');
};

const postReEnterMobile = async (req, res) => {
  res.redirect('/register/verify-mobile');
};

const getRegisterStartAgain = async (req, res) => {
  res.render('registration/start-register-again.njk');
};

const postRegisterStartAgain = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

const getStartAgainIncorrectOTP = async (req, res) => {
  res.render('registration/start-again-incorrect-otp.njk');
};

const postStartAgainIncorrectOTP = async (req, res) => {
  res.redirect('/register');
};

const getStartAgainExpiredOTP = async (req, res) => {
  res.render('registration/start-again-expired-otp.njk');
};

const postStartAgainExpiredOTP = async (req, res) => {
  res.redirect('/register');
};

const getResumeRegistration = async (req, res) => {
  res.render('registration/resume-registration.njk');
};

const postResumeRegistration = async (req, res) => {
  res.redirect('/register/mobile');
};

const getRegisterSessionTimeout = async (req, res) => {
  res.render('registration/session-timeout.njk');
};

const postRegisterSessionTimeout = async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/register');
  });
};

const getAddPhoneNumberIncorrectOtp = async (req, res) => {
  res.render('registration/add-mobile-sign-in.njk');
};

const postAddPhoneNumberIncorrectOtp = async (req, res) => {
  req.session.destroy(() => {
    res.redirect(process.env.SIGNIN_LINK);
  });
};

module.exports = {
  getLanding,
  postLanding,
  getEmail,
  postEmail,
  getResendEmail,
  postResendEmail,
  getVerifyEmail,
  postVerifyEmail,
  getEmailAlreadyRegistered,
  getCreatePassword,
  postCreatePassword,
  getMobile,
  postMobile,
  getVerifyMobile,
  postVerifyMobile,
  getResendMobile,
  postResendMobile,
  getComplete,
  postComplete,
  getReEnterEmail,
  postReEnterEmail,
  getReEnterMobile,
  postReEnterMobile,
  getRegisterStartAgain,
  postRegisterStartAgain,
  getStartAgainIncorrectOTP,
  postStartAgainIncorrectOTP,
  getStartAgainExpiredOTP,
  postStartAgainExpiredOTP,
  getResumeRegistration,
  postResumeRegistration,
  getRegisterSessionTimeout,
  postRegisterSessionTimeout,
  getAddPhoneNumberIncorrectOtp,
  postAddPhoneNumberIncorrectOtp,
};
