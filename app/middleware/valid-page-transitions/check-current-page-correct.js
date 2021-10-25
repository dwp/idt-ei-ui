const logger = require('../../lib/logger')();
const validPageTransitionsData = require('./valid-page-transitions.json');

// This middleware checks if current page is valid based on previous page user was on
// i.e. is it valid for the user to have moved from the previous page to the current page?
// This is to prevent users from navigating directly to a page in the journey
// or selecting browser back link when it is not valid to do so

module.exports = (journey) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  // detect current page from req.url, removing query parameters (everything after '?')
  const currentPage = req.url.split('?')[0];

  const {
    startAgainPath,
    exemptPages,
    validTransitions,
  } = validPageTransitionsData[journey];

  const startAgain = () => {
    req.session.destroy(() => {
      res.redirect(startAgainPath);
    });
  };

  if (exemptPages.includes(currentPage)) {
    // page is exempt from checking its validity
    // set previous page as current page and move to next middleware
    req.session.previousPage = currentPage;
    return next();
  }

  const { previousPage } = req.session;
  if (!previousPage) {
    logger.error(`Previous page not detected - redirecting to start again - for current page ${currentPage}`);
    return startAgain();
  }

  // allow user to remain on same page - i.e. page refresh or language toggle
  if (currentPage === previousPage) {
    return next();
  }

  const listedPreviousPages = validTransitions.map((transition) => transition.previousPage);
  if (!listedPreviousPages.includes(previousPage)) {
    logger.error(`Previous page not listed - redirect to start again page, current page =  ${currentPage}`);
    return startAgain();
  }

  const { permittedCurrentPages } = validTransitions.find(
    (transition) => previousPage === transition.previousPage,
  );
  if (!permittedCurrentPages.includes(currentPage)) {
    logger.error(`Page transition to ${currentPage} not allowed - redirecting to start again page`);
    return startAgain();
  }

  // page is valid - set previous page to current page and move to next middleware
  req.session.previousPage = currentPage;
  return next();
};
