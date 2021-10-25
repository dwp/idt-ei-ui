/** .........
 * Handles GET request for Accessibility Statement.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @returns {undefined}
 */
const getAccessibilityStatement = async (req, res) => {
  const backLinkUrl = (req.session.journey && req.session.previousPage)
    ? `${req.session.journey}${req.session.previousPage}`
    : process.env.SIGNIN_LINK;

  res.render('support-pages/accessibility.njk', {
    displayBackLink: true,
    backLinkUrl,
  });
};

module.exports = { getAccessibilityStatement };
