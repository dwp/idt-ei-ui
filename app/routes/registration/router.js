const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');
const checkCurrentPageIsCorrect = require('../../middleware/valid-page-transitions/check-current-page-correct');
const { clientsideSessionTimeoutConfig, checkSessionTimeout } = require('../../middleware/session-timeout');

const {
  emailValidationRules,
  passwordValidationRules,
  commonVerifySecurityCodeRules,
  mobileValidationRules,
} = require('../../lib/validation');

const {
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
  getComplete,
  postComplete,
  getResendMobile,
  postResendMobile,
  getReEnterEmail,
  postReEnterEmail,
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
  getReEnterMobile,
  postReEnterMobile,
  getAddPhoneNumberIncorrectOtp,
  postAddPhoneNumberIncorrectOtp,
} = require('.');

// track if user is on a valid page and redirect to start again if they are not
router.use('/', errorCatcher(checkCurrentPageIsCorrect('register')));

// check if there has been a session timeout
router.use(
  '/',
  clientsideSessionTimeoutConfig,
  errorCatcher(checkSessionTimeout),
);

router.route('/')
  .get(errorCatcher(getLanding))
  .post(errorCatcher(postLanding));

router.route('/email')
  .get(errorCatcher(getEmail))
  .post(emailValidationRules, errorCatcher(postEmail));

router.route('/resend-email')
  .get(errorCatcher(getResendEmail))
  .post(errorCatcher(postResendEmail));

router.route('/verify-email')
  .get(errorCatcher(getVerifyEmail))
  .post(commonVerifySecurityCodeRules, errorCatcher(postVerifyEmail));

router.route('/email-already-registered')
  .get(errorCatcher(getEmailAlreadyRegistered));

router.route('/password')
  .get(errorCatcher(getCreatePassword))
  .post(passwordValidationRules, errorCatcher(postCreatePassword));

router.route('/mobile')
  .get(errorCatcher(getMobile))
  .post(mobileValidationRules('reg-mobile:error.empty', 'common:errors.mobile.invalid'), errorCatcher(postMobile));

router.route('/resend-mobile')
  .get(errorCatcher(getResendMobile))
  .post(errorCatcher(postResendMobile));

router.route('/verify-mobile')
  .get(errorCatcher(getVerifyMobile))
  .post(commonVerifySecurityCodeRules, errorCatcher(postVerifyMobile));

router.route('/complete')
  .get(errorCatcher(getComplete))
  .post(errorCatcher(postComplete));

router.route('/re-enter-email')
  .get(errorCatcher(getReEnterEmail))
  .post(emailValidationRules, errorCatcher(postReEnterEmail));

router.route('/re-enter-mobile')
  .get(errorCatcher(getReEnterMobile))
  .post(emailValidationRules, errorCatcher(postReEnterMobile));

router.route('/start-register-again') //
  .get(errorCatcher(getRegisterStartAgain))
  .post(errorCatcher(postRegisterStartAgain));

router.route('/start-again-incorrect-otp')
  .get(errorCatcher(getStartAgainIncorrectOTP))
  .post(errorCatcher(postStartAgainIncorrectOTP));

router.route('/start-again-expired-otp')
  .get(errorCatcher(getStartAgainExpiredOTP))
  .post(errorCatcher(postStartAgainExpiredOTP));

router.route('/resume-registration')
  .get(errorCatcher(getResumeRegistration))
  .post(errorCatcher(postResumeRegistration));

router.route('/session-timeout')
  .get(errorCatcher(getRegisterSessionTimeout))
  .post(errorCatcher(postRegisterSessionTimeout));

router.route('/add-mobile-when-sign-in')
  .get(errorCatcher(getAddPhoneNumberIncorrectOtp))
  .post(errorCatcher(postAddPhoneNumberIncorrectOtp));

module.exports = router;
