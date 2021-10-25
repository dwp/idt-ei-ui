const logger = require('../lib/logger')();

// Pages which are exempt from the page session timeout
// i.e. non form pages with no personal data on them
// New journeys / new pages will need to be added here as required
const exemptPages = [
  '/password-reset',
  '/password-reset/success',
  '/password-reset/session-timeout',
  '/password-reset/start-again',
  '/password-reset/email-not-registered',
  '/password-reset/password-changed-recently',
  '/password-reset/temporary-lockout',
  '/password-reset/still-locked-out',
  '/password-reset/problem',
  '/registration/landing',
  '/registration/complete',
  '/registration/session-timeout',
  '/registration/start-again',
  '/registration/start-register-again',
  '/registration/start-again-expired',
  '/registration/email-not-registered',
  '/authentication/sign-in',
  '/authentication/session-timeout',
  '/authentication/start-again',
  '/authentication/temporary-lockout',
  '/authentication/temporary-lockout-sms',
  '/account-recovery/start-update-mobile',
];

// When a new journey is created, the journey start page needs to be added here
// This is the page which starts the 'whole journey session' timeout count
// Usually this should be the first form page in a journey
const startPages = [
  '/password-reset/email-address',
  '/authenticate',
  '/register/email',
  '/account-recovery/start-update-mobile',
];

// When a new journey is created, the url path to the session timeout needs to be added here
const sessionTimeoutPageMap = [{
  urlContains: 'password-reset',
  sessionTimeoutPath: '/password-reset/session-timeout',
}, {
  urlContains: 'authenticate',
  sessionTimeoutPath: '/authenticate/session-timeout',
}, {
  urlContains: 'register',
  sessionTimeoutPath: '/register/session-timeout',
}, {
  urlContains: 'findr',
  sessionTimeoutPath: '/authenticate/session-timeout',
}, {
  urlContains: 'account-recovery',
  sessionTimeoutPath: '/authenticate/session-timeout',
}];

/**
 * Finds appropriate session timeout url path based on page url.
 *
 * @param {string} url The url of the page the user is on.
 * @returns {string} The session timeout url path for the current journey.
 * @throws {object} Throws error if session timeout path not found.
 */
const findTimeoutPage = (url) => {
  const sessionTimeoutPath = sessionTimeoutPageMap.find((item) => url.includes(item.urlContains));
  if (sessionTimeoutPath) {
    return sessionTimeoutPath.sessionTimeoutPath;
  }
  throw new Error('Attempting to redirect to session timeout page, but session timeout path not found');
};

/**
 * Session timeout middleware.
 * Determines if the user has timed out and redirects to timeout page if required.
 *
 * @param {object} req The Request.
 * @param {object} res The Response.
 * @param {Function} next Calls next middleware.
 * @returns {undefined}
 */
const checkSessionTimeout = async (req, res, next) => {
  let javascriptEnabled = false;
  if (req.body.js) {
    javascriptEnabled = req.body.js === 'true';
  }

  const { PAGE_SESSION_TIMEOUT, JOURNEY_SESSION_TIMEOUT } = process.env;
  const sessionTimeoutRedirect = findTimeoutPage(req.originalUrl);

  if (!req.session) {
    logger.error('No session present. Redirecting to timeout page');
    res.redirect(sessionTimeoutRedirect);
  } else if (
    req.session.pageLoadTimeStamp
    && req.method === 'POST'
    && !javascriptEnabled // js not enabled, so timeout not handled on clientside
    && !exemptPages.includes(req.originalUrl)
    && ((new Date().getTime()) - req.session.pageLoadTimeStamp > PAGE_SESSION_TIMEOUT)
  ) {
    logger.error('Page session timeout exceeded - redirecting to timeout page');
    delete req.session.pageLoadTimeStamp;
    delete req.session.startJourneyTimeStamp;
    res.redirect(sessionTimeoutRedirect);
  } else if (
    req.session.startJourneyTimeStamp
    && req.method === 'POST'
    && ((new Date().getTime()) - req.session.startJourneyTimeStamp > JOURNEY_SESSION_TIMEOUT)
  ) {
    logger.error('Time limit for entire user journey exceeded - redirecting to timeout page');
    delete req.session.pageLoadTimeStamp;
    delete req.session.startJourneyTimeStamp;
    res.redirect(sessionTimeoutRedirect);
  } else {
    // set time stamps for current page load and start of journey if applicable
    if (req.method === 'GET') {
      req.session.pageLoadTimeStamp = new Date().getTime();
      if (startPages.includes(req.originalUrl)) {
        req.session.startJourneyTimeStamp = new Date().getTime();
      }
    }
    next();
  }
};

const clientsideSessionTimeoutConfig = (req, res, next) => {
  let journey = '';
  let journeySessionTimeoutPath = '';
  if (req.originalUrl.includes('register')) {
    journey = 'reg';
    journeySessionTimeoutPath = 'register';
  } else if (['authenticate', 'findr', 'account-recovery'].some((item) => req.originalUrl.includes(item))) {
    journey = 'auth';
    journeySessionTimeoutPath = 'authenticate';
  } else if (req.originalUrl.includes('password-reset')) {
    journey = 'reset';
    journeySessionTimeoutPath = 'password-reset';
  }

  res.locals.timeoutWarning = true;
  res.locals.timeoutWarningHeading = req.t(`${journey}-timeout-warning:h1`);
  res.locals.timeoutWarningButton = req.t(`${journey}-timeout-warning:button`);
  res.locals.sessionTimeoutPath = `/${journeySessionTimeoutPath}/session-timeout`;
  const sessionTimeoutMinutes = parseInt(process.env.PAGE_SESSION_TIMEOUT, 10) / 60000;
  const timeoutWarningVisibleTimeMinutes = (
    parseInt(process.env.TIMEOUT_WARNING_VISIBLE_TIME, 10) / 60000
  );
  res.locals.data = {
    timeoutText: req.t(`${journey}-timeout-warning:text`),
    timeoutExtraText: req.t(`${journey}-timeout-warning:extra-text`),
    modalIdleTime: sessionTimeoutMinutes - timeoutWarningVisibleTimeMinutes,
    modalVisibleTime: timeoutWarningVisibleTimeMinutes,
    // idle time is usually 19 minutes, plus 1 minute display of warning
    // 20 minutes session timeout in total
    activityTimeOut: parseInt(process.env.JOURNEY_SESSION_TIMEOUT, 10) / 60000,
    // inactivity time is timeout regardless of activity - usually 6 hrs
  };
  next();
};

module.exports = {
  checkSessionTimeout,
  findTimeoutPage,
  clientsideSessionTimeoutConfig,
};
