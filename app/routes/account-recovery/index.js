const {
  getCannotAccessEmail,
  postCannotAccessEmail,
} = require('./cannot-access-email');

const {
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
} = require('./start-update-mobile');

const {
  getNewMobileNumber,
  postNewMobileNumber,
  getVerifyNewMobileNumber,
  getARResendNewSMSCode,
  postARResendNewSMSCode,
  getARReenterNewMobileNumber,
  postVerifyNewMobileNumber,
} = require('./enter-new-mobile');

const {
  getChangeYourPassword,
  postChangeYourPassword,
  getCreateNewPassword,
  postCreateNewPassword,
} = require('./change-password');

const {
  getAccountRecoveryComplete,
  postAccountRecoveryComplete,
} = require('./success');

const {
  getARTemporaryLockout,
  getARStillTemporaryLockout,
} = require('./lockout');

const {
  getAccountRecoveryStartAgain,
  postAccountRecoveryStartAgain,
} = require('./start-again');

module.exports = {
  getCannotAccessEmail,
  postCannotAccessEmail,
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
  getNewMobileNumber,
  postNewMobileNumber,
  getVerifyNewMobileNumber,
  postVerifyNewMobileNumber,
  getARResendNewSMSCode,
  postARResendNewSMSCode,
  getARReenterNewMobileNumber,
  getChangeYourPassword,
  postChangeYourPassword,
  getCreateNewPassword,
  postCreateNewPassword,
  getAccountRecoveryComplete,
  postAccountRecoveryComplete,
  getARTemporaryLockout,
  getARStillTemporaryLockout,
  getAccountRecoveryStartAgain,
  postAccountRecoveryStartAgain,
};
