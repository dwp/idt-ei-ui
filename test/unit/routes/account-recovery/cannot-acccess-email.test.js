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

describe('account recovery - cannot access email', () => {
  it('should render "create new account" page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app).get('/account-recovery/cannot-access-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Update your sign in details');
  });
  it('should redirect to "register" page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app)
      .post('/account-recovery/cannot-access-email')
      .type('form')
      .send({ callbacks: [] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /register');
  });
});
