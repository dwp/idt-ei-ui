const request = require('supertest');
const axios = require('axios');
const express = require('express');
const session = require('../../../../app/middleware/session');

const { buildSingleValueCallback } = require('../../../utils/callback-builder');

jest.mock('axios');
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

describe('account recovery change your password', () => {
  it('It should redirect to change-your-password page if Change password prompt received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Change password'));
    const res = await request(app)
      .post('/account-recovery/verify-new-mobile-number')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/change-your-password');
  });
  it('It should render account-recovery change-your-password', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-new-mobile-number',
    });
    const res = await request(app).get('/account-recovery/change-your-password');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Do you want to change your password?');
  });
  it('It should generate an error if no password selection is made', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/change-your-password')
      .type('form')
      .send({ callbacks: [''] });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Select yes if you want to change your password');
  });
  it('It should redirect to the create-new-password page if yes is selected', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Create a password'));
    const res = await request(app)
      .post('/account-recovery/change-your-password')
      .type('form')
      .send({ callbacks: ['yes'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/create-new-password');
  });
  it('It should render error page if Create new password not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app)
      .post('/account-recovery/change-your-password')
      .type('form')
      .send({ callbacks: ['yes'] });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render account-recovery create-new-password', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/change-your-password',
    });
    const res = await request(app).get('/account-recovery/create-new-password');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Create a new password');
  });
  it('Create-new-password: password returns condition errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=Password12&callbacks=Password12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters:');
  });
  it('Create-new-password: Invalid password error', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=Password!>12&callbacks=Password!>12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters:');
  });
  it('Create-new-password: invalid password length', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=Test!12&callbacks=Test!12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must be 8 characters or more');
  });
  it('Create-new-password: empty password fields', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the password you&#39;d like to use');
  });
  it('Create-new-password: confirm password field empty', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=Password!12&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Re-enter your password');
  });
  it('Create-new-password: passwords do not match error', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .type('form')
      .send('callbacks=Password!12&callbacks=Password!13');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Your passwords do not match');
  });
  it('Create new password page should redirect to complete page if a valid password is entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue({
      data: {
        successUrl: '/am/console',
      },
    });
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .send('callbacks=Password!12&callbacks=Password!12');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/complete');
  });
  it('It should render error page if /am/console not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue({
      data: {
        successUrl: 'wrongPrompt',
      },
    });
    const res = await request(app)
      .post('/account-recovery/create-new-password')
      .send('callbacks=Password!12&callbacks=Password!12');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Change your password page should redirect to complete page if no is selected', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue({
      data: {
        successUrl: '/am/console',
      },
    });
    const res = await request(app)
      .post('/account-recovery/change-your-password')
      .send({ callbacks: ['no'] });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/complete');
  });
});
