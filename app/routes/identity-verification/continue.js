const createError = require('http-errors');
const _ = require('lodash');

const logger = require('../../lib/logger')();
const { hasPrompt } = require('../../lib/callbacks');
const { completeAuthentication, sendToDownstreamService } = require('../../lib/oidc-utils');
const { authenticationApi } = require('../../lib/am-api');
const buildRequestBody = require('../../lib/build-request-body');

module.exports = async (req, res, next) => {
  const { journeyId } = req.query;
  if (journeyId) {
    logger.info(`HMRC journey ID: ${journeyId}`);
    if (req.session && req.session.payload) {
      req.session.payload.callbacks[0].input[0].value = journeyId;
    }

    const requestBody = buildRequestBody(req);
    await authenticationApi(req, requestBody)
      .then(async (result) => {
        req.session.payload = result.data;

        const hasCallbacks = Boolean(result.data.callbacks);
        const hasSuccessUrl = Boolean(result.data.successUrl);

        if (!hasCallbacks && hasSuccessUrl) {
          sendToDownstreamService(req, res, result);
        } else {
          const HTMLMessageNodeValue = _.get(result, 'data.callbacks[1].output[1].value')
            ? _.get(result, 'data.callbacks[1].output[1].value') : '';

          if (HTMLMessageNodeValue.includes('HTMLMessageNode')) {
            completeAuthentication(req, res, result);
          } else if (hasPrompt(result, 'Provide a journeyId?')) {
            req.session.journey = 'authenticate';
            res.redirect('/identity-verification/redirect');
          } else {
            throw new Error('Unexpected response from AM after HMRC IV');
          }
        }
      }).catch((err) => {
        if (err.response.data.detail.failureUrl) {
          next(createError(500, err.response.data.detail.failureUrl));
        }
        throw err;
      });
  } else {
    logger.info('Missing journey ID');
    next(new Error('Missing journey ID'));
  }
};
