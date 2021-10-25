const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');

const { clientsideSessionTimeoutConfig, checkSessionTimeout } = require('../../middleware/session-timeout');
const checkCurrentPageIsCorrect = require('../../middleware/valid-page-transitions/check-current-page-correct');

const {
  getCannotAccessEmail,
  postCannotAccessEmail,
  getStartUpdateMobile,
  postStartUpdateMobile,
  getAREmailAddress,
  postAREmailAddress,
  getARVerifyEmail,
  postARVerifyEmail,
  getNewMobileNumber,
  postNewMobileNumber,
  getVerifyNewMobileNumber,
  postVerifyNewMobileNumber,
  getChangeYourPassword,
  postChangeYourPassword,
  getCreateNewPassword,
  getARResendNewSMSCode,
  postARResendNewSMSCode,
  getARReenterNewMobileNumber,
  getARResendEmailCode,
  postARResendEmailCode,
  getARReenterEmailAddress,
  getAREmailNotRegistered,
  postCreateNewPassword,
  getAccountRecoveryComplete,
  postAccountRecoveryComplete,
  getAccountRecoveryStartAgain,
  postAccountRecoveryStartAgain,
  getARTemporaryLockout,
  getARStillTemporaryLockout,
} = require('.');

const {
  emailValidationRules,
  passwordValidationRules,
  commonVerifySecurityCodeRules,
  mobileValidationRules,
  changePasswordValidation,
} = require('../../lib/validation');

// check if there has been a session timeout
router.use(
  '/',
  clientsideSessionTimeoutConfig,
  errorCatcher(checkSessionTimeout),
);

// track if user is on a valid page and redirect to start again if they are not
router.use('/', errorCatcher(checkCurrentPageIsCorrect('account-recovery')));

router.route('/cannot-access-email')
  .get(errorCatcher(getCannotAccessEmail))
  .post(errorCatcher(postCannotAccessEmail));

router.route('/start-update-mobile')
  .get(errorCatcher(getStartUpdateMobile))
  .post(errorCatcher(postStartUpdateMobile));

router.route('/resend-email-code')
  .get(errorCatcher(getARResendEmailCode))
  .post(errorCatcher(postARResendEmailCode));

router.route('/reenter-email-address')
  .get(errorCatcher(getARReenterEmailAddress));

router.route('/email-address')
  .get(errorCatcher(getAREmailAddress))
  .post(emailValidationRules, errorCatcher(postAREmailAddress));

router.route('/email-not-registered')
  .get(errorCatcher(getAREmailNotRegistered));

router.route('/verify-email')
  .get(errorCatcher(getARVerifyEmail))
  .post(commonVerifySecurityCodeRules, errorCatcher(postARVerifyEmail));

router.route('/new-mobile-number')
  .get(errorCatcher(getNewMobileNumber))
  .post(
    mobileValidationRules('account-recovery-new-mobile-number:error.empty', 'common:errors.mobile.invalid'),
    errorCatcher(postNewMobileNumber),
  );

router.route('/verify-new-mobile-number')
  .get(errorCatcher(getVerifyNewMobileNumber))
  .post(commonVerifySecurityCodeRules, errorCatcher(postVerifyNewMobileNumber));

router.route('/resend-new-sms-code')
  .get(errorCatcher(getARResendNewSMSCode))
  .post(errorCatcher(postARResendNewSMSCode));

router.route('/reenter-new-mobile-number')
  .get(errorCatcher(getARReenterNewMobileNumber));

router.route('/change-your-password')
  .get(errorCatcher(getChangeYourPassword))
  .post(changePasswordValidation, errorCatcher(postChangeYourPassword));

router.route('/create-new-password')
  .get(errorCatcher(getCreateNewPassword))
  .post(passwordValidationRules, errorCatcher(postCreateNewPassword));

router.route('/complete')
  .get(errorCatcher(getAccountRecoveryComplete))
  .post(errorCatcher(postAccountRecoveryComplete));

router.route('/start-again')
  .get(errorCatcher(getAccountRecoveryStartAgain))
  .post(errorCatcher(postAccountRecoveryStartAgain));

router.route('/temporary-lockout')
  .get(errorCatcher(getARTemporaryLockout));

router.route('/still-temporary-lockout')
  .get(errorCatcher(getARStillTemporaryLockout));

module.exports = router;
