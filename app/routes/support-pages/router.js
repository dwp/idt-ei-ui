const router = require('express').Router();

const { getAccessibilityStatement } = require('.');
const errorCatcher = require('../../lib/error-catcher');

router.route('/accessibility-statement')
  .get(errorCatcher(getAccessibilityStatement));

module.exports = router;
