const logger = require('./logger')();

module.exports = (req) => {
  logger.debug('merging user input(s) into payload');
  const { payload } = req.session;
  const postData = req.body;
  if (postData.callbacks) {
    payload.callbacks.forEach((value, i) => {
      payload.callbacks[i].input[0].value = postData.callbacks[i];
    });
  }

  return payload;
};
