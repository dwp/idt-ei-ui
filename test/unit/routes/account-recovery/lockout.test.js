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

describe('account recovery locked out', () => {
  it('It should render account-recovery temporary lockout page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/account-recovery/temporary-lockout');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You have been locked out for 15 minutes');
  });
  it('It should render account-recovery still locked out page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/account-recovery/still-temporary-lockout');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You are still locked out');
  });
});
