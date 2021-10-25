const axios = require('axios');

const post = async (url, data, req) => axios.post(
  url,
  data,
  {
    headers: {
      'Content-Type': 'application/json',
      'Accept-API-Version': 'protocol=1.0,resource=2.1',
      language: req.cookies.lng ? req.cookies.lng : 'en',
      ...(req.headers['user-agent']) && { 'User-Agent': req.headers['user-agent'] },
      ...(req.headers['x-correlation-id']) && { 'X-Correlation-ID': req.headers['x-correlation-id'] },
      ...(req.headers['x-session-id']) && { 'X-Session-ID': req.headers['x-session-id'] },
      ...(req.headers['x-forwarded-for']) && { 'X-Forwarded-For': req.headers['x-forwarded-for'] },
    },
  },
);

const registrationApi = async (req, data) => {
  const url = `${process.env.AM_API_URL}${process.env.AM_REALM_PATH}/authenticate?service=${process.env.AM_REGISTRATION_TREE_NAME}&authIndexType=service&authIndexValue=${process.env.AM_REGISTRATION_TREE_NAME}`;
  return post(url, data, req);
};

const authenticationApi = async (req, data) => {
  const url = `${process.env.AM_API_URL}${process.env.AM_REALM_PATH}/authenticate?service=${process.env.AM_AUTHENTICATION_TREE_NAME}&authIndexType=service&authIndexValue=${process.env.AM_AUTHENTICATION_TREE_NAME}`;
  return post(url, data, req);
};

const passwordResetApi = async (req, data) => {
  const url = `${process.env.AM_API_URL}${process.env.AM_REALM_PATH}/authenticate?service=${process.env.AM_PASSWORD_RESET_TREE_NAME}&authIndexType=service&authIndexValue=${process.env.AM_PASSWORD_RESET_TREE_NAME}`;
  const returnData = await post(url, data, req);
  return returnData;
};

const accountRecoveryApi = async (req, data) => {
  const url = `${process.env.AM_API_URL}${process.env.AM_REALM_PATH}/authenticate?service=${process.env.AM_ACCOUNT_RECOVERY_TREE_NAME}&authIndexType=service&authIndexValue=${process.env.AM_ACCOUNT_RECOVERY_TREE_NAME}`;
  const returnData = await post(url, data, req);
  return returnData;
};

module.exports = {
  registrationApi,
  authenticationApi,
  passwordResetApi,
  accountRecoveryApi,
};
