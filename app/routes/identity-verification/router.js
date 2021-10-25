const router = require('express').Router();
const errorCatcher = require('../../lib/error-catcher');

const redirect = require('./redirect');
const cont = require('./continue');

router.route('/redirect').get(errorCatcher(redirect));
router.route('/continue').get(errorCatcher(cont));

module.exports = router;
