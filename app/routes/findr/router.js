const router = require('express').Router();

const errorCatcher = require('../../lib/error-catcher');
const { checkSessionTimeout, clientsideSessionTimeoutConfig } = require('../../middleware/session-timeout');

const {
  nameValidationRules,
  dateOfBirthValidationRules,
  postcodeValidationRules,
} = require('../../lib/validation');

const {
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
} = require('.');

// track if user is on a valid page and redirect to start again if they are not
// router.use('/', errorCatcher(checkCurrentPageIsCorrect('findr')));

// check if there has been a session timeout.
router.use(
  '/',
  clientsideSessionTimeoutConfig,
  errorCatcher(checkSessionTimeout),
);

router.route('/name')
  .get(errorCatcher(getFindrName))
  .post(nameValidationRules, errorCatcher(postFindrName));

router.route('/date-of-birth')
  .get(errorCatcher(getFindrDOB))
  .post(dateOfBirthValidationRules, errorCatcher(postFindrDOB));

router.route('/postcode')
  .get(errorCatcher(getFindrPostcode))
  .post(postcodeValidationRules, errorCatcher(postFindrPostcode));

router.route('/not-found')
  .get(errorCatcher(getFindrNotFound))
  .post(errorCatcher(postFindrNotFound));

router.route('/could-not-sign-in')
  .get(errorCatcher(getFindrCouldNotSignIn))
  .post(errorCatcher(postFindrCouldNotSignIn));

module.exports = router;
