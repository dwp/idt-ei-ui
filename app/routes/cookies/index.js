const logger = require('../../lib/logger')();

const cookieOptions = {
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  httpOnly: true,
  secure: true,
};

const obtainRedirectToPreviousPage = (session) => {
  let redirectUrl;
  if (!session.journey || !session.previousPage) {
    logger.error('Either journey or previous page not set in session when trying to redirect from cookie banner');
    logger.error('Redirecting to home sign in page');
    redirectUrl = process.env.SIGNIN_LINK;
  } else {
    redirectUrl = `/${session.journey}${session.previousPage}`;
  }
  return redirectUrl;
};

const getCookies = (req, res) => {
  const linkToPreviousPage = obtainRedirectToPreviousPage(req.session);
  let useAnalyticCookiesRadioSelection = 'no';
  if (req.cookies.seen_cookie_message === 'accept') {
    useAnalyticCookiesRadioSelection = 'yes';
  }
  res.render('support-pages/cookies.njk', {
    displayCookiesBanner: false,
    linkToPreviousPage,
    displayBackLink: true,
    backLinkUrl: linkToPreviousPage,
    useAnalyticCookiesRadioSelection,
  });
};

const postCookies = (req, res) => {
  if (req.body.useAnalyticCookies === 'accept') {
    res.cookie('seen_cookie_message', 'accept', cookieOptions);
  } else if (req.body.useAnalyticCookies === 'reject') {
    res.cookie('seen_cookie_message', 'reject', cookieOptions);
    // delete analytic cookies
    res.cookie('_ga', '', { maxAge: 0 });
    res.cookie('_gat', '', { maxAge: 0 });
    res.cookie('_gid', '', { maxAge: 0 });
  }

  req.session.displayCookiesSuccessPanel = true;

  res.redirect('/cookies');
};

const postCookiesBanner = (req, res) => {
  if (req.body.cookies === 'accept') {
    res.cookie('seen_cookie_message', 'accept', cookieOptions);
    req.session.displayCookiesAcceptance = true;
  } else if (req.body.cookies === 'reject') {
    res.cookie('seen_cookie_message', 'reject', cookieOptions);
    req.session.displayCookiesRejection = true;
  }
  res.redirect(obtainRedirectToPreviousPage(req.session));
};

const postCookiesHideMessage = (req, res) => {
  req.session.displayCookiesAcceptance = false;
  req.session.displayCookiesRejection = false;
  res.redirect(obtainRedirectToPreviousPage(req.session));
};

module.exports = {
  getCookies, postCookies, postCookiesBanner, postCookiesHideMessage,
};
