module.exports = (app) => {
  app.use('/', (req, res, next) => {
    if (req.cookies.seen_cookie_message) {
      res.locals.displayCookiesBanner = false;

      if (req.cookies.seen_cookie_message === 'accept') {
        res.locals.allowGoogleAnalytics = true;
      }

      if (req.session.displayCookiesAcceptance) {
        res.locals.displayCookiesAcceptance = true;
        // prevent cookies acceptance message from being displayed on subsequent pages
        req.session.displayCookiesAcceptance = false;
      } else if (req.session.displayCookiesRejection) {
        res.locals.displayCookiesRejection = true;
        // prevent cookies rejection message from being displayed on subsequent pages
        req.session.displayCookiesRejection = false;
      }
    } else {
      res.locals.displayCookiesBanner = true;
    }

    if (req.session.displayCookiesSuccessPanel) {
      res.locals.displayCookiesSuccessPanel = true;
      // prevent panel from being displayed again
      req.session.displayCookiesSuccessPanel = false;
    }

    next();
  });
};
