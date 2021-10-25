const getAccountRecoveryStartAgain = async (req, res) => {
  res.render('account-recovery/start-again.njk');
};

const postAccountRecoveryStartAgain = async (req, res) => {
  res.redirect(process.env.SIGNIN_LINK);
};

module.exports = {
  getAccountRecoveryStartAgain,
  postAccountRecoveryStartAgain,
};
