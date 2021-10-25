const logger = require('../../lib/logger')();

const config = { ...process.env };

module.exports = async (req, res) => {
  logger.info('User passed to HMRC IV');
  res.cookie('i18next', req.cookies.i18next);
  res.redirect(`${config.HMRC_REQUEST_DETAILS_URL}?continueUrl=${config.UI_BASE_URL.replace(/\/+$/, '')}/identity-verification/continue`);
};
