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

describe('account recovery - start again', () => {
  it('should render "start again" page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app).get('/account-recovery/start-again');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You need to start again');
  });
  it('It should redirect to the downstream service', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    process.env.SIGNIN_LINK = 'http://downstream-service';
    const res = await request(app).post('/account-recovery/start-again');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service');
  });
});
