const request = require('supertest');
const axios = require('axios');
const express = require('express');
const session = require('../../../../app/middleware/session');

const { buildSingleValueCallback, buildTwoValueCallback } = require('../../../utils/callback-builder');

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
const { buildError401Callback } = require('../../../utils/callback-builder');

describe('account recovery - start update mobile', () => {
  it('should render "start update mobile" page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app).get('/account-recovery/start-update-mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Update your mobile phone number');
  });
  it('It should redirect to enter email address page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('User Name'));
    const res = await request(app).post('/account-recovery/start-update-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/email-address');
  });
  it('It should render error page if expected prompt User Name not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app).post('/account-recovery/start-update-mobile');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render email-address page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/start-update-mobile',
    });
    const res = await request(app).get('/account-recovery/email-address');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the email address you use to sign in');
  });
  it('It should redirect back to enter email address page if user selects "reenter"', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/resend-email-code',
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('User Name'));
    const res = await request(app).get('/account-recovery/reenter-email-address');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/email-address');
  });
  it('It should render error page if "email address" prompt not received', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/resend-email-code',
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app).get('/account-recovery/reenter-email-address');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render resend-email-code page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/account-recovery/resend-email-code');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new email');
  });
  it('It should redirect back to verify-email-address page', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app).post('/account-recovery/resend-email-code');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/verify-email');
  });
  it('It should render error page if verify-email-address security code not received', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app).post('/account-recovery/resend-email-code');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should redirect to temporary lockout it TEMP LOCK OUT failure url received', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockRejectedValue(buildError401Callback('TEMP_LOCKOUT'));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/temporary-lockout');
  });
  it('It should redirect to still locked out screen if STILL_TEMP_LOCKED_OUT failure url received', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockRejectedValue(buildError401Callback('STILL_TEMP_LOCKOUT'));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/still-temporary-lockout');
  });
  it('Throws error if wrong prompt received', async () => {
    const app = setSession(selfServiceApp);
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'Wrong prompt',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should redirect to email not registered screen if EMAIL_NOT_REGISTERED failure url received', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockRejectedValue(buildError401Callback('EMAIL_NOT_REGISTERED'));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/email-not-registered');
  });
  it('It should render email not registered page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/account-recovery/email-not-registered');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This email address is not registered with this service');
  });
  it('Email validation errors', async () => {
    const app = setSession(selfServiceApp);
    let res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['-anemail@somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');

    res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['anemail@<somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');

    res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['an..email@somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');

    res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['invalid-email.test'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');

    res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: [''] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your email address');
  });
  it('should call ForgeRock if a valid email entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['test@validemail.com'] });
    expect(axios.post).toHaveBeenCalled();
  });
  it('It should redirect to verify-email page if Security code prompt received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['test@validemail.com'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/verify-email');
  });
  it('It should render error page if Security code not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app)
      .post('/account-recovery/email-address')
      .type('form')
      .send({ callbacks: ['test@validemail.com'] });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render verify-email page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/email-address',
    });
    const res = await request(app).get('/account-recovery/verify-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you an email with your security code');
  });
  it('Email OTP incorrect format', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    let res = await request(app)
      .post('/account-recovery/verify-email')
      .send('callbacks=123487-&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');

    res = await request(app)
      .post('/account-recovery/verify-email')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });
  it('Submit Expired Security Code on Verify Email Page returns error', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });
  it('It should redirect to name page if First name prompt received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('First name'));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/name');
  });
  it('It should render error page if First name not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app)
      .post('/account-recovery/verify-email')
      .type('form')
      .send({ callbacks: ['123456'] });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
});
