module.exports = (req, res, next) => {
  res.locals.isAuthenticated = req.path.includes('authenticate') ? false : !!req.session[process.env.SSO_HEADER_NAME];
  next();
};
