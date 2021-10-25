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

describe('account recovery - enter new mobile', () => {
  it('It should render account-recovery new-mobile-number', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/postcode',
    });
    const res = await request(app).get('/account-recovery/new-mobile-number');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your new mobile phone number');
  });
  it('Mobile number validation errors', async () => {
    const app = setSession(selfServiceApp);
    let res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['000000000&&&&0000000'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('UK mobile numbers must start with 07. International numbers must start with a country code.');

    res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: [''] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Mobile phone number is required to continue with account recovery');
  });
  it('should call ForgeRock if valid mobile number entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));

    let res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['07123456789'] });
    expect(axios.post).toHaveBeenCalled();

    res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['+07391543481'] });
    expect(res.statusCode).toEqual(302);
    expect(axios.post).toHaveBeenCalled();

    res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ 'callbacks[0]': '07391543481 ', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(axios.post).toHaveBeenCalled();

    res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['+0 7391543482'] });
    expect(res.statusCode).toEqual(302);
    expect(axios.post).toHaveBeenCalled();
  });
  it('It should redirect to verify-new-mobile-number page if Security code prompt received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['07123456789'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/verify-new-mobile-number');
  });
  it('It should render error page if Security code not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app)
      .post('/account-recovery/new-mobile-number')
      .type('form')
      .send({ callbacks: ['07123456789'] });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render verify-new-mobile-number page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/new-mobile-number',
    });
    const res = await request(app).get('/account-recovery/verify-new-mobile-number');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you a text message with your security code');
  });
  it('It should render resend-new-sms-code page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-new-mobile-number',
    });
    const res = await request(app).get('/account-recovery/resend-new-sms-code');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new text message');
  });
  it('It should redirect back to verify-new-mobile-number page', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app).post('/account-recovery/resend-new-sms-code');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/verify-new-mobile-number');
  });
  it('It should render error page if verify-new-sms-code security code not received', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app).post('/account-recovery/resend-new-sms-code');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should redirect back to enter new mobile page if user selects reenter', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/resend-new-sms-code',
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Mobile number'));
    const res = await request(app).get('/account-recovery/reenter-new-mobile-number');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /account-recovery/new-mobile-number');
  });
  it('It should render error page if Mobile number prompt not received', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/resend-new-sms-code',
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app).get('/account-recovery/reenter-new-mobile-number');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('New mobile OTP validation errors, no OTP entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/account-recovery/verify-new-mobile-number')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });

  it('New mobile OTP validation errors, incorrect format entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const res = await request(app)
      .post('/account-recovery/verify-new-mobile-number')
      .type('form')
      .send('callbacks=123&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Submit Expired Security Code on Verify New Mobile Number Page returns error', async () => {
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
      .post('/account-recovery/verify-new-mobile-number')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });
  it('should display error if incorrect security code entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const res = await request(app)
      .post('/account-recovery/verify-new-mobile-number')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });
});
