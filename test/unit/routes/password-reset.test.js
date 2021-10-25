const request = require('supertest');
const axios = require('axios');
const express = require('express');
const session = require('../../../app/middleware/session');

const { buildSingleValueCallback, buildTwoValueCallback, buildError401Callback } = require('../../utils/callback-builder');

jest.mock('axios');
jest.mock('../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));
jest.mock('../../../app/middleware/session');

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

const selfServiceApp = require('../../../app/app');

describe('Password Reset', () => {
  it('It should redirect to authenticate sign in if password already set', async () => {
    const app = setSession(selfServiceApp, {
      passwordAlreadyReset: true,
    });
    process.env.SIGNIN_LINK = 'http://downstream-service';
    const res = await request(app).get('/password-reset/email-address');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service');
  });
  it('It should not redirect to authenticate sign in if password already set, but user navigates to password reset landing page', async () => {
    const app = setSession(selfServiceApp, {
      passwordAlreadyReset: true,
    });
    process.env.AUTHENTICATE_SIGNIN = 'authenticate-sign-in';
    const res = await request(app).get('/password-reset');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Reset your password');
  });
  it('It should render Password Reset landing page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).get('/password-reset');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Reset your password');
  });
  it('Password Reset landing page, it should redirect to email page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).post('/password-reset');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/email-address');
  });
  it('It should render Start Again page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).get('/password-reset/start-again');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You need to start your password reset journey again');
  });
  it('It should redirect to password reset landing page from start again', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).post('/password-reset/start-again');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset');
  });
  it('It should render session timeout page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).get('/password-reset/session-timeout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Reset password stopped');
  });
  it('It should destroy session and redirect to landing page when Start Again button selected on session timeout page', async () => {
    const destroyMock = jest.fn();
    destroyMock.mockImplementation((callback) => {
      callback();
    });
    const app = setSession(selfServiceApp, {
      destroy: destroyMock,
    });
    const res = await request(app).post('/password-reset/session-timeout');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset');
  });
  it('It should render Password Reset email page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('User Name'));
    const res = await request(app).get('/password-reset/email-address');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the email address');
  });
  it('It should render error page if expected prompt User Name not received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app).get('/password-reset/email-address');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Password Reset: email not sent error returns problem with this service page', async () => {
    const app = setSession(selfServiceApp);
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'ERROR_SENDING_EMAIL',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['validemail@somedomain.com'] });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /password-reset/problem');
  });
  it('Password Reset: if there is an error other than email not sent, it should display generic error page', async () => {
    const app = setSession(selfServiceApp);
    const err = new Error('some other error');
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['validemail@somedomain.com'] });
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render problem page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app).get('/password-reset/problem');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Password Reset: Invalid email with hyphen at start returns validation errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['-anemail@somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });
  it('Password Reset: Invalid email with invalid special character returns validation errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['anemail@<somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });
  it('Password Reset: Invalid email with repeated special character returns validation errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['an..email@somedomain.com'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });
  it('Password Reset: Invalid email without @ returns validation errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/email-address')
      .type('form')
      .send({ callbacks: ['invalid-email.test'] });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });
  it('Render resend-email address page ', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/password-reset/resend-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new email');
  });
  it('Render email verification page on resend of email code', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/resend-email')
      .type('form')
      .send({ 'callbacks[0]': 'resend', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/password-reset/verify-email');
  });
  it('It should render error page if expected prompt Security code not received from ForgeRock', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/resend-email')
      .type('form')
      .send({ 'callbacks[0]': 'resend', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Password Reset: Valid email and user found - proceed to verify email code', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app)
      .post('/password-reset/email-address')
      .send('callbacks=valid@email.com&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/verify-email');
  });
  it('Password Reset: Valid email and user found (with two full stops after @ - proceed to verify email code', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app)
      .post('/password-reset/email-address')
      .send('callbacks=valid@email.somedomain.com&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/verify-email');
  });
  it('It should render error page if expected prompt Security code not received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/password-reset/email-address')
      .send('callbacks=valid@email.com&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render verify email page', async () => {
    const app = setSession(selfServiceApp, {
      email: 'an.email@somedomain.com',
      previousPage: '/email-address',
    });
    const res = await request(app).get('/password-reset/verify-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you an email with your security code');
  });
  it('It should redirect to email-address page when re-enter email address link is selected', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/resend-email',
    });
    const res = await request(app).get('/password-reset/reenter-email-address');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/email-address');
  });
  it('It should render password-changed-recently error page, when the security code has been entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockRejectedValue(buildError401Callback('PASSWORD_CHANGED_RECENTLY'));

    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/password-changed-recently');
  });
  it('It should display error view if unexpected error received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const err = new Error('Unexpected error format');
    axios.post.mockImplementation(() => {
      throw err;
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('should render to password-changed-recently page, after verify-email', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/password-reset/password-changed-recently');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You cannot reset your password');
  });

  it('Password Reset: it should display empty error if security code is empty', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });
  it('Password Reset: email security code does not match error', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Submit Expired Security Code on Verify Email Page returns error', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-email',
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const res = await request(app)
      .post('/password-reset/verify-email')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });
  it('Password Reset: temporary locked out on third failed OTP attempt', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-email',
    });
    axios.post.mockRejectedValue(buildError401Callback('TEMP_LOCKOUT'));
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/temporary-lockout');
  });
  it('Password Reset: user is still locked out', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-email',
    });
    axios.post.mockRejectedValue(buildError401Callback('STILL_TEMP_LOCKOUT'));

    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/still-locked-out');
  });
  it('It should render temporary-lockout page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    const res = await request(app).get('/password-reset/temporary-lockout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You have been locked out for 15 minutes');
  });
  it('It should render still locked out page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    const res = await request(app).get('/password-reset/still-locked-out');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You are still locked out');
  });
  it('Password Reset: User not found', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockRejectedValue(buildError401Callback('EMAIL_NOT_REGISTERED'));
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.get('Location')).toEqual('/password-reset/email-not-registered');
  });
  it('It should render email not registered page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/password-reset/email-not-registered');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This email address is not registered with this service');
  });
  it('it should render error if unexpected failure url received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockRejectedValue(buildError401Callback('UNEXPECTED_URL'));
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Verify email page, it should redirect to Verify Mobile Page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/verify-mobile');
  });
  it('Verify email page, it should redirect to New Password page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Create a password'));
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/new-password');
  });
  it('It should render error page if prompt from ForgeRock is not Create a Password', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/password-reset/verify-email')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Should display generic error page if unrecognised error received on Verify Email page', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
      },
    });
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app)
      .post('/password-reset/verify-email')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Should render new password page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-mobile',
    });
    const res = await request(app).get('/password-reset/new-password');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Create a new password');
  });
  it('Password Reset: SMS failure to send returns problem with this service page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockRejectedValue(buildError401Callback('SMS_NOT_SENT'));

    const res = await request(app)
      .post('/password-reset/verify-email')
      .type('form')
      .send('callbacks=123456&callbacks=123456');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /password-reset/problem');
  });
  it('Password Reset: error other than SMS not sent, it should display generic error page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const err = new Error('some other error');
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password!12&callbacks=Password!12');
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Verify Mobile Page, it should redirect to new-password page if successful', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Create a password'));
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/new-password');
  });
  it('Verify Mobile page, it should render error page if One Time Password prompt not received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('New-password: password returns condition errors', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password12&callbacks=Password12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters:');
  });
  it('New-password: Invalid password error', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password!>12&callbacks=Password!>12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters:');
  });
  it('New-password: invalid password length', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Test!12&callbacks=Test!12');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must be 8 characters or more');
  });
  it('New-password: empty password fields', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the password you&#39;d like to use');
  });
  it('New-password: confirm password field empty', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password!12&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Re-enter your password');
  });
  it('Password Reset: email not sent error returns problem with this service page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'ERROR_SENDING_EMAIL',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password!01&callbacks=Password!01');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toEqual('Found. Redirecting to /password-reset/problem');
  });
  it('New-password: passwords do not match error', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/password-reset/new-password')
      .type('form')
      .send('callbacks=Password!12&callbacks=Password!13');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Your passwords do not match');
  });
  it('It should render verify mobile page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/password-reset/verify-mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you a text message with your security code');
  });
  it('It should render new SMS page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-mobile',
    });
    const res = await request(app).get('/password-reset/resend-mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new text message');
  });
  it('It should return to verify mobile page', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const res = await request(app).post('/password-reset/resend-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/verify-mobile');
  });
  it('It should render error page if prompt from ForgeRock is not Security Code', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app).post('/password-reset/resend-mobile');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Password Reset: SMS security code does not match error first attempt', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Password Reset: temporary locked out on third failed sms OTP attempt', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-mobile',
    });
    axios.post.mockRejectedValue(buildError401Callback('TEMP_LOCKOUT'));
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/temporary-lockout');
  });
  it('Password Reset: it should display empty error if security code is empty', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });
  it('Password Reset: SMS security code does not match error', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });
  it('Submit Expired Security Code on Verify Mobile Page returns error', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-email',
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .type('form')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });

  it('Submit Invalid Security Code on Verify Mobile Page, but returns error on second call to ForgeRock', async () => {
    let numberOfAxiosCalls = 0;
    axios.post.mockImplementation(() => {
      if (numberOfAxiosCalls === 0) {
        numberOfAxiosCalls++;
        // receives expected response on first call to ForgeRock
        return buildTwoValueCallback('resendExpiredOTP', 0);
      }
      // receives error on second call to ForgeRock
      throw new Error();
    });
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      currentPage: 'verify-mobile',
    });
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Password Reset: it should display generic error page when unexpected error returned when sms code is entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    const err = new Error('Unexpected error');
    axios.post.mockImplementation(() => {
      throw err;
    });
    app.use((req, res, next) => {
      req.session.payload = {};
      next();
    });
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Verify mobile page, it should render error page if neither success url nor One Time Password prompt received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('Verify mobile page, redirect to error page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue('Something else...');
    const res = await request(app)
      .post('/password-reset/verify-mobile')
      .send('callbacks=123456&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('New password, it should redirect to success page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue({
      data: {
        successUrl: '/am/console',
      },
    });
    const res = await request(app)
      .post('/password-reset/new-password')
      .send('callbacks=Password!01&callbacks=Password!01');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset/success');
  });
  it('New password, it should render error page if success url not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/password-reset/new-password')
      .send('callbacks=Password!01&callbacks=Password!01');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render success page after new-password page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/new-password',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    const res = await request(app).get('/password-reset/success');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password reset');
  });
  it('It should redirect to signin page, when user selects continue from signin page', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      previousPage: 'success',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    process.env.SIGNIN_LINK = 'http://downstream-service';
    const res = await request(app).post('/password-reset/success');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service');
  });
});
