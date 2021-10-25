const axios = require('axios');
const qs = require('querystring');
const moment = require('moment-timezone');
const _ = require('lodash');

const { authenticationApi } = require('./am-api');
const logger = require('./logger')();

const processOIDCRedirect = async (req, res) => {
  const redirectAuthorize = req.session.goto;
  const { tokenId } = req.session.payload;
  await axios.request({
    url: redirectAuthorize,
    method: 'post',
    maxRedirects: 0,
    data: qs.stringify({
      csrf: tokenId,
      decision: 'allow',
    }),
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `${process.env.SSO_HEADER_NAME}=${tokenId};`,
    },
  }).then((result) => {
    logger.debug(result);
  }).catch((err) => {
    if (err.response && err.response.status === 302) {
      logger.debug(`Redirecting back to OIDC flow to ${err.response.headers.location}`);
      res.redirect(err.response.headers.location);
    } else {
      throw err;
    }
  });
};

const extractDateFromHtmlMessage = (data, language) => {
  const htmlMessage = _.get(data, 'data.callbacks[0].output[0].value');
  const regex = /innerHTML\b\s.*}]/g;
  const innerHTML = htmlMessage.match(regex);
  let lastLogin;
  if (innerHTML) {
    const lastLogins = JSON.parse(innerHTML[0].replace('innerHTML = \'', '').replace('\';', ''));
    const successfulLogins = lastLogins.filter((login) => login.status === 'SUCCESS');
    if (successfulLogins.length > 0) {
      const loginDates = successfulLogins.map((login) => login.date);
      const latestDate = Math.max(...loginDates, 0);
      moment.locale(language || 'en');
      const parsedLastestDate = moment.tz(latestDate, 'Europe/London');
      lastLogin = {
        time: parsedLastestDate.format('h:mma'),
        date: parsedLastestDate.format('D MMM YYYY'),
      };
    }
  }
  return lastLogin;
};

const sendToDownstreamService = (req, res, continueResponse) => {
  if (continueResponse.data.successUrl === '/am/console') {
    req.session.payload = continueResponse.data;
    req.session[process.env.SSO_HEADER_NAME] = continueResponse.data.tokenId;
    res.cookie(process.env.SSO_HEADER_NAME, continueResponse.data.tokenId, { httpOnly: true });
    req.session.currentPage = process.env.SIGNIN_LINK;
    processOIDCRedirect(req, res);
  } else {
    throw new Error('Success url /am/console expected from AM but not received');
  }
};

const completeAuthentication = async (req, res, result) => {
  const lastLogin = extractDateFromHtmlMessage(result, req.cookies.i18next);
  if (lastLogin) {
    req.session.lastLogin = lastLogin;
    res.redirect('/authenticate/last-login');
  } else {
    const continueLastLoginResponse = await authenticationApi(req, req.session.payload);
    sendToDownstreamService(req, res, continueLastLoginResponse);
  }
};

module.exports = { completeAuthentication, sendToDownstreamService };
