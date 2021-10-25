const getFullLockout = (req, res) => (
  res.render('authentication/full-lockout.njk', {
    serviceSupportInstructions: req.t(
      `configurable-text:${process.env.SERVICE}-support-instructions`,
    ),
  }));

const postFullLockout = (req, res) => {
  res.redirect('/password-reset');
};

module.exports = {
  getFullLockout,
  postFullLockout,
};
