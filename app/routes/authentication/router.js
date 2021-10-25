const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');
const checkCurrentPageIsCorrect = require('../../middleware/valid-page-transitions/check-current-page-correct');
const { clientsideSessionTimeoutConfig, checkSessionTimeout } = require('../../middleware/session-timeout');

const {
  commonVerifySecurityCodeRules,
} = require('../../lib/validation');

const {
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
  postAuthResendMobile,
  getAuthStartAgain,
  postAuthStartAgain,
  signInValidationRules,
  getAuthenticateSessionTimeout,
  postAuthenticateSessionTimeout,
  getLastLogin,
  postLastLogin,
} = require('.');

// track if user is on a valid page and redirect to start again if they are not
router.use('/', errorCatcher(checkCurrentPageIsCorrect('sign-in')));

// check if there has been a session timeout
router.use(
  '/',
  clientsideSessionTimeoutConfig,
  errorCatcher(checkSessionTimeout),
);

router.route('/')
  .get(errorCatcher(getSignIn))
  .post(signInValidationRules, errorCatcher(postSignIn));

router.route('/verify-mobile')
  .get(errorCatcher(getAuthVerifyMobile))
  .post(commonVerifySecurityCodeRules, errorCatcher(postAuthVerifyMobile));

router.route('/temporary-lockout')
  .get(errorCatcher(getTemporaryLockout));

router.route('/full-lockout')
  .get(errorCatcher(getFullLockout));

router.route('/full-lockout')
  .post(errorCatcher(postFullLockout));

router.route('/temporary-lockout-sms')
  .get(errorCatcher(getTemporaryLockoutSMS));

router.route('/still-temp-lockout')
  .get(errorCatcher(getStillTempLockedOut));

router.route('/resend-mobile')
  .get(errorCatcher(getAuthResendMobile))
  .post(errorCatcher(postAuthResendMobile));

router.route('/last-login')
  .get(errorCatcher(getLastLogin))
  .post(errorCatcher(postLastLogin));

router.route('/start-again')
  .get(errorCatcher(getAuthStartAgain))
  .post(errorCatcher(postAuthStartAgain));

router.route('/session-timeout')
  .get(errorCatcher(getAuthenticateSessionTimeout))
  .post(errorCatcher(postAuthenticateSessionTimeout));

router.route('/problem')
  .get(errorCatcher(authenticateProblem));

module.exports = router;
