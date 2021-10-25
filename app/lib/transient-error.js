/** Set a transient error on the request session.
 *
 * @param req
 * @param error An object that can be JSON stringified.
 */

const setTransientError = (req, error) => {
  req.session.transientError = error;
};

/** Get the transient error from the request session.
 *
 * @param req
 * @returns {undefined|any}
 */

const getTransientError = (req) => {
  const { transientError } = req.session;
  req.session.transientError = undefined;
  return transientError;
};

module.exports = {
  setTransientError,
  getTransientError,
};
