/**
 * Handles GET request for Cannot Access Email view in account recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getCannotAccessEmail = async (req, res) => {
  req.session.journey = 'account-recovery';
  res.render('account-recovery/cannot-access-email.njk');
};

/**
 * Handles POST request for Cannot Access Email view in account recovery.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const postCannotAccessEmail = async (req, res) => {
  res.redirect('/register');
};

module.exports = {
  getCannotAccessEmail,
  postCannotAccessEmail,
};
