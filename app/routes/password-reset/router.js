const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');
const checkCurrentPageIsCorrect = require('../../middleware/valid-page-transitions/check-current-page-correct');
const { clientsideSessionTimeoutConfig, checkSessionTimeout } = require('../../middleware/session-timeout');

const {
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
} = require('.');

const {
  emailValidationRules,
  passwordValidationRules,
  commonVerifySecurityCodeRules,
} = require('../../lib/validation');

// now check if password has already been reset
// this will redirect to signin page if password has already been reset
router.use('/', errorCatcher(passwordResetCheckIfPasswordAlreadyReset));

// track if user is on a valid page and redirect to start again if they are not
router.use('/', errorCatcher(checkCurrentPageIsCorrect('password-reset')));

// check if there has been a session timeout
router.use(
  '/',
  clientsideSessionTimeoutConfig,
  errorCatcher(checkSessionTimeout),
);

router.route('/')
  .get(errorCatcher(getPasswordResetLanding))
  .post(errorCatcher(postPasswordResetLanding));

router.route('/email-address')
  .get(errorCatcher(getPasswordResetEmail))
  .post(emailValidationRules, errorCatcher(postPasswordResetEmail));

router.route('/verify-email')
  .get(errorCatcher(getPasswordResetVerifyEmail))
  .post(commonVerifySecurityCodeRules, errorCatcher(postPasswordResetVerifyEmail));

router.route('/resend-email')
  .get(errorCatcher(getPasswordResetResendEmail))
  .post(errorCatcher(postPasswordResetResendEmail));

router.route('/email-not-registered')
  .get(errorCatcher(getPasswordResetEmailNotRegistered));

router.route('/verify-mobile')
  .get(errorCatcher(getPasswordResetVerifyMobile))
  .post(commonVerifySecurityCodeRules, errorCatcher(postPasswordResetVerifyMobile));

router.route('/resend-mobile')
  .get(errorCatcher(getPasswordResetNewSMS))
  .post(errorCatcher(postPasswordResetNewSMS));

router.route('/reenter-email-address')
  .get(errorCatcher(getPasswordResetReenterEmailAddress));

router.route('/password-changed-recently')
  .get(errorCatcher(getPasswordResetPasswordChangedRecently));

router.route('/new-password')
  .get(errorCatcher(getPasswordResetNewPassword))
  .post(passwordValidationRules, errorCatcher(postPasswordResetNewPassword));

router.route('/success')
  .get(errorCatcher(getPasswordResetSuccess))
  .post(errorCatcher(postPasswordResetSuccess));

router.route('/start-again')
  .get(errorCatcher(getPasswordResetStartAgain))
  .post(errorCatcher(postPasswordResetStartAgain));

router.route('/session-timeout')
  .get(errorCatcher(getPasswordResetSessionTimeout))
  .post(errorCatcher(postPasswordResetSessionTimeout));

router.route('/problem')
  .get(errorCatcher(getPasswordResetProblem));

router.route('/temporary-lockout')
  .get(errorCatcher(getResetTemporaryLockout));

router.route('/still-locked-out')
  .get(errorCatcher(getResetStillLockedOut));

module.exports = router;
