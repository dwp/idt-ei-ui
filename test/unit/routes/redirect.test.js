const request = require('supertest');
const express = require('express');
const session = require('../../../app/middleware/session');

jest.mock('../../../app/middleware/session');

// bypass session
session.mockImplementation(() => {});

process.env = {
  UI_BASE_URL: 'url',
  HMRC_REQUEST_DETAILS_URL: 'hmrc_url',
};

const app = require('../../../app/app');

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  const sessionApp = express();
  sessionApp.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  sessionApp.use(selfServiceAppObj);
  return sessionApp;
};

describe('Redirect - entry point to HMRC IV', () => {
  it('redirects users to HMRC IV', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/identity-verification/redirect');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toContain('Found. Redirecting to hmrc_url?continueUrl=url/identity-verification/continue');
  });
});
