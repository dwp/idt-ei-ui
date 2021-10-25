const request = require('supertest');
const express = require('express');
const session = require('../../../../app/middleware/session');

jest.mock('../../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));
jest.mock('../../../../app/middleware/session');

// bypass session
session.mockImplementation(() => {});

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  const app = express();
  app.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  app.use(selfServiceAppObj);
  return app;
};

const selfServiceApp = require('../../../../app/app');

describe('account recovery - success', () => {
  it('It should render account-recovery complete page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/create-new-password',
    });
    const res = await request(app).get('/account-recovery/complete');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Sign in details updated');
  });
  it('It should redirect to sign in page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).post('/account-recovery/complete');

    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to http://localhost:3002/benefit/options');
  });
});
