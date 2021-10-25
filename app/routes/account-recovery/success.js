const getAccountRecoveryComplete = async (req, res) => {
  res.render('account-recovery/complete.njk');
};

const postAccountRecoveryComplete = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

module.exports = {
  getAccountRecoveryComplete,
  postAccountRecoveryComplete,
};
