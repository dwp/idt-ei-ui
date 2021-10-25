const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { postComplete } = require('../../../app/routes/registration');
const mockRequest = require('../../utils/mock-request');
const mockResponse = require('../../utils/mock-response');
let session = require('../../../app/middleware/session');

const app = require('../../../app/app');

const {
  buildSingleValueCallback,
  buildTwoValueCallback,
  buildError401Callback,
  buildSuccessfulAuthenticationCallback,
} = require('../../utils/callback-builder');

jest.mock('axios');
jest.mock('../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));
jest.mock('../../../app/middleware/session');

const destroyMock = jest.fn();
destroyMock.mockImplementation((callback) => {
  callback();
});

// bypass session
session.mockImplementation(() => {});

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  // eslint-disable-next-line no-shadow,no-undef
  const sessionApp = express();
  sessionApp.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  sessionApp.use(selfServiceAppObj);
  return sessionApp;
};

describe('Registration', () => {
  it('Landing page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Register');
  });

  it('Submit Landing page', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/email',
    });
    const res = await request(testApp).post('/register');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/email');
  });

  it('Email Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('User Name'));
    const testApp = setSession(app, {
      previousPage: '/',
    });
    const res = await request(testApp).get('/register/email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your email address');
  });

  it('Invalid email returns validation errors', async () => {
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ callbacks: 'invalid-email.test' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });

  it('Should error if email address is too long', async () => {
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@bbb.com' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });

  it('Should error if there are invalid characters in domain section of email', async () => {
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test@exa!mple.com' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter an email address in the correct format, like name@example.com');
  });

  it('It should render session timeout page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/session-timeout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Registration stopped');
  });
  it('It should destroy session and redirect to landing page when Start Again button selected on session timeout page', async () => {
    const testApp = setSession(app, {
      destroy: destroyMock,
    });
    const res = await request(testApp).post('/register/session-timeout');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register');
  });
  it('No email returns validation errors', async () => {
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ callbacks: '' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your email address');
  });
  it('Render Sorry there is a problem page when returns error while sending email', async () => {
    axios.post.mockRejectedValue(buildError401Callback('ERROR_SENDING_EMAIL'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', callbacks: '' });

    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should throw an error when an unexpected error is returned', async () => {
    axios.post.mockRejectedValue(buildError401Callback('UNEXPECTED ERROR'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', callbacks: '' });

    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Render "Sorry there is a problem" page when returns error while sending sms', async () => {
    axios.post.mockRejectedValue(buildError401Callback('ERROR_SENDING_SMS'));
    const testApp = setSession(app, {
      currentPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '07391543480', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Render "verify mobile" page when returns error while sending sms', async () => {
    axios.post.mockRejectedValue(buildError401Callback('UNEXPECTED_ERROR'));
    const testApp = setSession(app, {
      currentPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '07391543480', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toContain('Found. Redirecting to /register/verify-mobile');
  });

  it('Render email verification page if email is valid', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render email verification page if email is valid with leading whitespaces', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': '  test@example.com', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render email verification page if email is valid with trailing whitespaces', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com  ', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render email verification page if email is valid with whitespaces in body', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/email')
      .type('form')
      .send({ 'callbacks[0]': 'test @ exa mple.com', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render verify email page ', async () => {
    const testApp = setSession(app, {
      previousPage: '/email',
    });
    const res = await request(testApp).get('/register/verify-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you an email with your security code');
  });

  it('Render resend email address page ', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-email',
    });
    const res = await request(testApp).get('/register/resend-email');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new email');
  });

  it('It should redirect to start again page, if verify email is not set as the current page when user is on resend-email page', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/wrong-page',
      destroy: destroyMock,
    });
    const res = await request(testApp).get('/register/resend-email');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-register-again');
  });

  it('Return to email-address screen if re-enter-email link selected', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    // eslint-disable-next-line no-shadow
    session = { payload: { callbacks: [] }, previousPage: '/resend-email' };
    const testApp = setSession(app, session);
    const res = await request(testApp).get('/register/re-enter-email');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/email');
  });

  it('Render email verification page if email is valid', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/re-enter-email')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render email verification page ON resend of email code', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/register/resend-email',
    });
    const res = await request(testApp)
      .post('/register/resend-email')
      .type('form')
      .send({ 'callbacks[0]': 'resend', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-email');
  });

  it('Render Password entry page if email code is valid and email does not already exist', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/password');
  });

  it('Redirect email already registered page if code is valid and email already exists', async () => {
    axios.post.mockRejectedValue(buildError401Callback('EMAIL_ALREADY_REGISTERED'));
    const testApp = setSession(app, {
      currentPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/email-already-registered');
  });

  it('Render email already registered page', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-email',
    });
    const res = await request(testApp).get('/register/email-already-registered');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This email address is already registered with this service');
  });

  it('Submit Invalid Security Code on Verify Email Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    let res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');

    res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });

  it('Submit Invalid Security Code on Verify Email Page, but returns error on second call to ForgeRock', async () => {
    let numberOfAxiosCalls = 0;
    axios.post.mockImplementation(() => {
      if (numberOfAxiosCalls === 0) {
        numberOfAxiosCalls++;
        // receives expected response on first call to ForgeRock
        return buildTwoValueCallback('failedOTPAttempt', 0);
      }
      // receives error on second call to ForgeRock
      throw new Error();
    });
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Submit Invalid Security Code on Verify Mobile Page, but returns error on second call to ForgeRock', async () => {
    let numberOfAxiosCalls = 0;
    axios.post.mockImplementation(() => {
      if (numberOfAxiosCalls === 0) {
        numberOfAxiosCalls++;
        // receives expected response on first call to ForgeRock
        return buildTwoValueCallback('failedOTPAttempt', 0);
      }
      // receives error on second call to ForgeRock
      throw new Error();
    });
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should display generic error page if unrecognised failureURL received on Verify Email page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('UNRECOGNISED'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });

    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should display generic error page if unrecognised error received on Verify Email page', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
      },
    });
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should destroy session and redirect to start-again page if incorrect OTP for email attempted 3 times', async () => {
    axios.post.mockRejectedValue(buildError401Callback('OTP_INCORRECT'));
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-again-incorrect-otp');
  });

  it('Should destroy session and redirect to start-again page if expired OTP attempted 3 times', async () => {
    axios.post.mockRejectedValue(buildError401Callback('OTP_EXPIRED'));
    const destroySession = jest.fn();
    destroySession.mockImplementation((callback) => {
      callback();
    });
    const testApp = setSession(app, {
      destroy: destroySession,
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(destroySession).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-again-expired-otp');
  });

  it('Should render resume-registration page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/resume-registration');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You must complete your registration before you sign in');
  });

  it('Should render mobile page after resume-registration page', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/resume-registration',
    });
    const res = await request(testApp)
      .post('/register/resume-registration')
      .type('form')
      .send({ callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.text).toContain('Found. Redirecting to /register/mobile');
  });

  it('Should render start-register-again page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/start-register-again');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You need to start your registration again');
  });

  it('Should render start-again-expired-otp page', async () => {
    const testApp = setSession(app, { previousPage: '/verify-email' });
    const res = await request(testApp).get('/register/start-again-expired-otp');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You need to start your registration again');
  });

  it('Should redirect to register page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).post('/register/start-again-expired-otp');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register');
  });

  it('Submit Expired Security Code on Verify Email Page returns error', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });

  it('Create Password Page', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-email',
    });
    const res = await request(testApp).get('/register/password');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Create a password');
  });

  it('Empty password fields shows validation errors', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/password',
    });
    let res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': 'Teting@01' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the password you&#39;d like to use');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Testing@01', 'callbacks[1]': '' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Re-enter your password');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': '' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter the password you&#39;d like to use');
    expect(res.text).toContain('Re-enter your password');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': '  ', 'callbacks[1]': '  ' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must be 8 characters or more');
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters');
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': '123456789§', 'callbacks[1]': '123456789§' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters');
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');
  });

  it('Passwords do not match validation error', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/password',
    });
    const res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Testing@01', 'callbacks[1]': 'testing@01' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Your passwords do not match');
  });

  it('Invalid password shows validation errors', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/password',
    });
    let res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'password', 'callbacks[1]': 'password' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': '12345678', 'callbacks[1]': 'jefjef' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');
    expect(res.text).toContain('Your passwords do not match');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Testing@01 ', 'callbacks[1]': 'Testing@01 ' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Testing01£ ', 'callbacks[1]': 'Testing@01£ ' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must only include letters, numbers, and these special characters');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'test', 'callbacks[1]': 'test' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must be 8 characters or more');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'P@ssw0', 'callbacks[1]': 'P@ssw0' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must be 8 characters or more');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Password§12', 'callbacks[1]': 'Password§12' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'Password±12', 'callbacks[1]': 'Password±12' });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Password must include at least one uppercase letter, one lowercase letter and number and at least one of these special characters');
  });

  it('Valid password redirects to mobile number page', async () => {
    axios.post.mockResolvedValue(buildTwoValueCallback('Password', 'Confirm Password'));
    const testApp = setSession(app, {
      previousPage: '/register/password',
    });
    let res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'P@ssw0rd', 'callbacks[1]': 'P@ssw0rd' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/mobile');

    res = await request(testApp)
      .post('/register/password')
      .type('form')
      .send({ 'callbacks[0]': 'P[ssw0rd', 'callbacks[1]': 'P[ssw0rd' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/mobile');
  });

  it('Mobile Number Page', async () => {
    const testApp = setSession(app, {
      previousPage: '/password',
    });
    const res = await request(testApp).get('/register/mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your mobile phone number');
  });

  it('should redirect to start if not on register mobile page', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/wrong-page',
      destroy: destroyMock,
    });
    const res = await request(testApp).get('/register/mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-register-again');
  });

  it('Post Valid Mobile Number', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '07391543480', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('Post Valid Mobile Number with + sign in the beginning', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '+07391543481', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('Post Valid Mobile Number with space', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '07391543481', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('Post Valid Mobile Number with + and space', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/mobile',
    });
    const res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '+0 7391543482', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('Post Invalid Mobile Number', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/mobile',
    });
    let res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '000000000&&&&0000000', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('UK mobile numbers must start with 07. International numbers must start with a country code.');
    res = await request(testApp)
      .post('/register/mobile')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your mobile phone number');
  });

  it('Verify Mobile Number Page', async () => {
    const testApp = setSession(app, {
      previousPage: '/mobile',
    });
    const res = await request(testApp).get('/register/verify-mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('We have sent you a text message with your security code');
  });

  it('Submit valid Security Code on Verify Mobile Number Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/complete');
  });

  it('Submit valid Security Code on Verify Mobile Number Page with leading white space', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': ' 123456', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/complete');
  });

  it('Submit valid Security Code on Verify Mobile Number Page with trailing white space', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456 ', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/complete');
  });

  it('Submit valid Security Code on Verify Mobile Number Page with white space in body of input', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '12 34 56', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/complete');
  });

  it('Submit Invalid Security Code on Verify Mobile Page', async () => {
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    let res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');

    res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your security code');
  });

  it('Should display generic error page if unrecognised failureURL received on Verify Mobile page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('UNRECOGNISED'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should display generic error page if unrecognised error received on Verify Mobile page', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
      },
    });
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('Should redirect to add-mobole-when-sign-in page if incorrect mobile OTP attempted 3 times', async () => {
    axios.post.mockRejectedValue(buildError401Callback('OTP_INCORRECT'));
    const destroySession = jest.fn();
    destroySession.mockImplementation((callback) => {
      callback();
    });
    const testApp = setSession(app, {
      previousPage: '/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/add-mobile-when-sign-in');
  });

  it('Should destroy session and redirect to start-again page if expired mobile OTP attempted 3 times', async () => {
    axios.post.mockRejectedValue(buildError401Callback('OTP_EXPIRED'));
    const destroySession = jest.fn();
    destroySession.mockImplementation((callback) => {
      callback();
    });
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
      destroy: destroySession,
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(destroySession).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-again-expired-otp');
  });

  it('Submit Invalid Security Code on Verify Mobile Number Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('failedOTPAttempt'))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Submit Expired Security Code on Verify Mobile Number Page returns error', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });
  it('It should render complete page', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-mobile',
    });
    const res = await request(testApp).get('/register/complete');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Registration complete');
  });
  it('It should redirect to registration landing page from start again', async () => {
    const testApp = setSession(app);
    process.env.SIGNIN_LINK = 'http://downstream-service';
    const res = await request(testApp).post('/register/start-register-again');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service');
  });
  it('It should redirect to start again page, if verify-email is not set as the current page when user is on Resend Email page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/verify-email');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if email is not set as the current page when user is on Email page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/email');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if email-already-registered is not set as the current page when user is on email already registered page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/email-already-registered');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if resend-email is not set as the current page when user is on resend email page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/resend-email');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if verify-email is not set as the current page when user is on re-enter-email page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/re-enter-email');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if password is not set as the current page when user is on password page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/password');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if verify-mobile is not set as the current page when user is on verify mobile page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/verify-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('It should redirect to start again page, if complete is not set as the current page when user is on complete page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/complete');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('Render mobile verification page ON resend of mobile code', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-mobile',
    });
    const res = await request(testApp)
      .post('/register/resend-mobile')
      .type('form')
      .send({ 'callbacks[0]': 'resend', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('It should redirect to start again page, if verify-mobile is not set as the current page when user is on re-enter-mobile page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/re-enter-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/register/start-register-again');
  });

  it('Return to re-enter-mobile screen if re-enter-email link selected', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''));
    // eslint-disable-next-line no-shadow
    session = { payload: { callbacks: [] }, previousPage: '/resend-mobile' };
    const testApp = setSession(app, session);
    const res = await request(testApp).get('/register/re-enter-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/mobile');
  });

  it('Render mobile verification page if email is valid', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/register/re-enter-mobile')
      .type('form')
      .send({ 'callbacks[0]': '07391543480', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/verify-mobile');
  });

  it('Render resend mobile number page ', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-mobile',
    });
    const res = await request(testApp).get('/register/resend-mobile');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Send me a new text message');
  });

  it('should redirect to start again if trying to access resent mobile page but current page not verify-mobile', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/register/resend-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/start-register-again');
  });

  it('redirect to downstream service when selecting continue on registration complete page', async () => {
    // eslint-disable-next-line no-shadow
    session = { payload: buildSuccessfulAuthenticationCallback().data };
    const req = mockRequest(session);
    const res = mockResponse();
    process.env.SIGNIN_LINK = 'http://downstream-service';
    await postComplete(req, res);

    expect(res.redirect).toHaveBeenCalledWith('http://downstream-service');
  });

  it('Should redirect to temporary lockout page if TEMP_LOCKOUT is received from ForgeRock', async () => {
    axios.post.mockRejectedValue(buildError401Callback('TEMP_LOCKOUT'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/temporary-lockout-sms');
  });

  it('Should redirect full lockout page if FULL_LOCKOUT is received from ForgeRock', async () => {
    axios.post.mockRejectedValue(buildError401Callback('FULL_LOCKOUT'));
    const testApp = setSession(app, {
      previousPage: '/register/verify-email',
    });
    const res = await request(testApp)
      .post('/register/verify-email')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/full-lockout');
  });
});
