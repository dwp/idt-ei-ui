const request = require('supertest');
const axios = require('axios');
const express = require('express');

const app = require('../../../app/app');

const {
  buildSingleValueCallback,
  buildTwoValueCallback,
  buildSuccessfulAuthenticationCallback,
  buildOIDCRedirectCallback,
  buildError401Callback,
} = require('../../utils/callback-builder');

jest.mock('axios');
jest.mock('../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));

const destroyMock = jest.fn();
destroyMock.mockImplementation((callback) => {
  callback();
});

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  const sessionApp = express();
  const session = { ...sessionValues };
  sessionApp.use((req, res, next) => {
    req.session = session;
    next();
  });
  sessionApp.use(selfServiceAppObj);
  return sessionApp;
};

describe('Authentication', () => {
  it('Sign in', async () => {
    axios.post.mockResolvedValue(buildTwoValueCallback('Username', 'Password'));
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Sign in');
  });

  it('Render mobile verification page if email and password are valid', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/verify-mobile');
  });

  it('Render mobile verification page if email has blanks but is otherwise valid and password is valid', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app, {
      currentPage: '/authenticate/verify-mobile',
    });
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': ' test @ example . com ', 'callbacks[1]': 'P@ssw0rd' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/verify-mobile');
  });

  it('Should render "resume-registration" route if authenticated and no mobile has been provided', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Enter Mobile Number'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/register/resume-registration');
  });

  it('Display validation error if email and/or password are not provided', async () => {
    const testApp = setSession(app);
    let res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': 'P@ssw0rd' });
    res = await request(testApp)
      .get('/authenticate');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your email address');

    res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': '' });
    res = await request(testApp)
      .get('/authenticate');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your password');

    res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': '', 'callbacks[1]': '' });
    res = await request(testApp)
      .get('/authenticate');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your email address');
    expect(res.text).toContain('Enter your password');
  });

  it('It should render session timeout page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate/session-timeout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Sign in stopped');
  });

  it('It should destroy session and redirect to landing page when Start Again button selected on session timeout page', async () => {
    process.env.SIGNIN_LINK = 'http://downstream-service-protected-page';
    const testApp = setSession(app, {
      destroy: destroyMock,
    });
    const res = await request(testApp).post('/authenticate/session-timeout');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service-protected-page');
  });

  it('Redirect to verify mobile page if email and password are correct', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Security code'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/verify-mobile');
  });

  it('Show error if email and/or password are incorrect on first attempt', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'NO_MATCH1',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    const res = await request(testApp)
      .get('/authenticate');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('The email address or password you entered is incorrect');
    expect(res.text).toContain('Register now if you have not used this service before');
  });

  it('Show error if email and/or password are incorrect on second attempt', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'NO_MATCH2',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    const res = await request(testApp)
      .get('/authenticate');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('The email address or password you entered is incorrect');
    expect(res.text).toContain('You will be locked out if you enter incorrect sign in details one more time');
  });

  it('Show temp lockout view if TEMP_LOCKOUT message received from ForgeRock', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'TEMP_LOCKOUT',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.get('Location')).toContain('/temporary-lockout');
  });

  it('Show full lockout view if FULL_LOCKOUT message received from ForgeRock', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'FULL_LOCKOUT',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.get('Location')).toContain('/full-lockout');
  });

  it('Show should render temp still-locked-out page if login attempted during temp lockout', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'STILL_TEMP_LOCKOUT',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.get('Location')).toContain('/still-temp-lockout');
  });

  it('Show should render full still-locked-out page if login attempted during full lockout', async () => {
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'STILL_FULL_LOCKOUT',
        },
      },
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.get('Location')).toContain('/full-lockout');
  });

  it('Submit invalid format Security Code on Verify Mobile Number Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '1111', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Submit incorrect Security Code on Verify Mobile Number Page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback(''))
      .mockResolvedValue(buildTwoValueCallback('failedOTPAttempt', 0));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Security code does not match the one we sent you');
  });

  it('Submit incorrect Security Code on Verify Mobile Number Page, on third failure - render temporary lockout page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('TEMP_LOCKOUT'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/temporary-lockout');
  });

  it('Submit incorrect Security Code on Verify Mobile Number Page, on max failure - render full lockout page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('FULL_LOCKOUT'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/full-lockout');
  });

  it('should display generic error page if unrecognised failure url received on Verify Mobile page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('NOT_RECOGNISED'));
    const res = await request(app)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it.skip('Submit Expired Security Code on Verify Mobile Number Page returns error', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('resendExpiredOTP'))
      .mockResolvedValue(buildTwoValueCallback('resendExpiredOTP', 0));
    const res = await request(app)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });

  it('should display generic error page if unexpected error returned from ForgeRock on Verify Mobile page', async () => {
    axios.post.mockRejectedValue({
      response: {
        status: 500,
      },
    });
    const res = await request(app)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it.skip('Submit Expired Security Code on Verify Mobile Number Page returns error', async () => {
    axios.post.mockRejectedValue(buildError401Callback('OTP_EXPIRED'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('This security code has expired. We have sent you a new code.');
  });

  it('It should display generic error page when unexpected error returned when sms code is entered', async () => {
    const err = new Error('Unexpected error');
    axios.post.mockImplementation(() => {
      throw err;
    });
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render error page if prompt from ForgeRock is not Security Code', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong Prompt'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate')
      .type('form')
      .send({ 'callbacks[0]': 'test@example.com', 'callbacks[1]': 'P@ssw0rd' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/problem');
  });

  it('It should render problem page', async () => {
    const testApp = setSession(app, {});
    const res = await request(testApp)
      .get('/authenticate/problem');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });

  it('It should render Findr name page if valid mobileOTP entered', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('First name'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/authenticate/name');
  });

  it('It should redirect to IDV page if idv is needed entered', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Provide a journeyId?'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/identity-verification/redirect');
  });

  it('Sign into CXP when a valid postcode has been entered', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Provide a journeyId?'));

    axios.request.mockRejectedValue(buildOIDCRedirectCallback());
    const testApp = setSession(app, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    const res = await request(testApp)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');
  });

  it('Signs into downstream service when valid mobileOTP has been entered with verfied account, and no previous lastlogin', async () => {
    axios.post.mockReturnValueOnce({
      data: {
        authId: '',
        callbacks: [
          { output: [{ value: "message.innerHTML = '{{lastLogins}}'" }] },
          { output: [{}, { value: 'HTMLMessageNode' }] },
        ],
      },
    }).mockReturnValue(buildSuccessfulAuthenticationCallback());
    axios.request.mockRejectedValue(buildOIDCRedirectCallback());

    const testApp = setSession(app, {
      payload: { callbacks: [] },
    });
    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/callback');
  });

  it('display lastlogin page when valid mobileOTP has been entered with verfied account, and there were previous logins', async () => {
    const innerHTMLString = `message.innerHTML = '${JSON.stringify(
      [{
        date: '1627651143500',
        status: 'SUCCESS',
      }],
    )}'`;
    axios.post.mockReturnValueOnce({
      data: {
        authId: '',
        callbacks: [{
          output: [{
            value: innerHTMLString,
          }],
        }, {
          output: [{}, { value: 'HTMLMessageNode' }],
        }],
      },
    });

    const testApp = setSession(app, {
      payload: { callbacks: [] },
    });

    const res = await request(testApp)
      .post('/authenticate/verify-mobile')
      .type('form')
      .send({ 'callbacks[0]': '123456', callbacks: '' });

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/last-login');
  });

  it('It should render last login page', async () => {
    const testApp = setSession(app, {
      lastLogin: {
        date: '2 Nov 2012',
        time: '1:23pm',
      },
    });
    const res = await request(testApp)
      .get('/authenticate/last-login');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('1:23pm on 2 Nov 2012');
  });

  it('It should go to downstream service after the last login page', async () => {
    const testApp = setSession(app, {
      payload: { callbacks: [] },
    });

    axios.post.mockResolvedValue(buildSuccessfulAuthenticationCallback());
    axios.request.mockRejectedValue(buildOIDCRedirectCallback());

    const res = await request(testApp)
      .post('/authenticate/last-login');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/callback');
  });

  it('It should render temporary-lockout page', async () => {
    const testApp = setSession(app, {
      previousPage: '/',
    });
    const res = await request(testApp).get('/authenticate/temporary-lockout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You have been locked out for 15 minutes');
  });
  it('It should render start again page if user hits directly temporary lockout page', async () => {
    const testApp = setSession(app, {
      destroy: destroyMock,
    });
    const res = await request(testApp).get('/authenticate/temporary-lockout');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });
  it('It should render full-lockout page', async () => {
    const testApp = setSession(app, {
      previousPage: '/',
    });
    const res = await request(testApp).get('/authenticate/full-lockout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You are locked out');
  });
  it('It should render start again page if user hits directly full lockout page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/full-lockout');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });
  it('should redirect to password reset when the user selects submit button on full lockout page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).post('/authenticate/full-lockout');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/password-reset');
  });

  it('It should render still temp locked out page', async () => {
    const testApp = setSession(app, {
      previousPage: '/',
    });
    const res = await request(testApp).get('/authenticate/still-temp-lockout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You are still locked out');
  });

  it('It should render start-again page if user hits directly still temp locked out page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/still-temp-lockout');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });
  it('It should render Start Again page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/start-again');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You need to start again');
  });
  it('It should render render start-again page if user hits directly verify mobile page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/verify-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });
  it('It should render Start Again page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/resend-mobile');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });

  it('It should render temporary lockout page for incorrect sms entry', async () => {
    const testApp = setSession(app, {
      previousPage: '/verify-mobile',
    });
    const res = await request(testApp).get('/authenticate/temporary-lockout-sms');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('You have been locked out for 15 minutes');
  });

  it('It should render start again sms page if user hits directly temporary lockout page', async () => {
    const testApp = setSession(app, { destroy: destroyMock });
    const res = await request(testApp).get('/authenticate/temporary-lockout-sms');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/start-again');
  });

  it('It should redirect to the sign-in page from start again page', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).post('/authenticate/start-again');
    expect(res.statusCode).toEqual(302);
    expect(res.text).toContain(`Found. Redirecting to ${process.env.SIGNIN_LINK}`);
  });
});
