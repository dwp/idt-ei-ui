const logger = require('../lib/logger')();

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  logger.error(err.stack);
  let errorTmpl = err.status || 500;

  if (errorTmpl !== 404 && errorTmpl !== 500) {
    errorTmpl = 500;
  }

  res.render(`errors/${errorTmpl}.njk`);
};
