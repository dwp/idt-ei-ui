const getARTemporaryLockout = async (req, res) => {
  res.render('account-recovery/temporary-lockout.njk', {
    accountRecoveryLink: process.env.SIGNIN_LINK,
  });
};

const getARStillTemporaryLockout = async (req, res) => {
  res.render('account-recovery/still-locked-out.njk', {
    accountRecoveryLink: process.env.SIGNIN_LINK,
  });
};

module.exports = {
  getARTemporaryLockout,
  getARStillTemporaryLockout,
};
