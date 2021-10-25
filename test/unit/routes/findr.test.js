const request = require('supertest');
const express = require('express');
const axios = require('axios');
const session = require('../../../app/middleware/session');

const { buildError401Callback } = require('../../utils/callback-builder');

jest.mock('axios');
jest.mock('../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));
jest.mock('../../../app/middleware/session');

// bypass session
session.mockImplementation(() => {});

const {
  buildSingleValueCallback,
} = require('../../utils/callback-builder');

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
const { buildOIDCRedirectCallback } = require('../../utils/callback-builder');

describe('findr', () => {
  it('should render findr name page', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('First name'));
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
      previousPage: '/verify-mobile',
    });
    const res = await request(app).get('/authenticate/name');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your name?');
  });

  it('Name does not pass validation errors', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('First name'));
    let res = await request(app)
      .post('/authenticate/name')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your first name');
    expect(res.text).toContain('Enter your last name');

    res = await request(app)
      .post('/authenticate/name')
      .type('form')
      .send('callbacks=John@&callbacks=Smith2');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('First name must only include letters a to z, hyphens, spaces and apostrophes');
    expect(res.text).toContain('Last name must only include letters a to z, hyphens, spaces and apostrophes');
  });

  it('should render authentication session timeout page', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
    });
    const res = await request(app).get('/authenticate/session-timeout');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Sign in stopped');
  });

  it('It should destroy session and redirect to authenticate landing page when Start Again button selected on session timeout page', async () => {
    process.env.SIGNIN_LINK = 'http://downstream-service-protected-page';
    const destroyMock = jest.fn();
    destroyMock.mockImplementation((callback) => {
      callback();
    });
    const testApp = setSession(selfServiceApp, {
      destroy: destroyMock,
    });
    const res = await request(testApp).post('/authenticate/session-timeout');
    expect(destroyMock).toHaveBeenCalled();
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('http://downstream-service-protected-page');
  });
  it('It should render error page if Day prompt not received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/authenticate/name')
      .type('form')
      .send({ 'callbacks[0]': 'John', 'callbacks[1]': 'Smith' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should redirect to date of birth page', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Day'));
    const res = await request(app)
      .post('/authenticate/name')
      .type('form')
      .send({ 'callbacks[0]': 'Bèrgström', 'callbacks[1]': 'Pâté' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/date-of-birth');
  });
  it('It should render findr date-of-birth page', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
      previousPage: '/name',
    });
    const res = await request(app).get('/authenticate/date-of-birth');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your date of birth?');
  });
  it('Date of birth does not pass validation errors', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '', month: '', year: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '', month: '06', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '32', month: '02', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '13', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '32', month: '13', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '02', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '31', month: '9', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: 'aa', month: 'aa', year: 'aa' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '85' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Year must be 4 digits');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '3024' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be in the past');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '1800' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Check the year you were born');
  });
  it('It should redirect to Postcode if valid date added', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '29', month: '02', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/postcode');

    res = await request(app)
      .post('/authenticate/date-of-birth')
      .type('form')
      .send({ day: '31', month: '01', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/postcode');
  });
  it('Name: it should render error page if postcode prompt not received from ForgeRock',
    async () => {
      const app = setSession(selfServiceApp, {
        payload: { callbacks: [] },
        journey: 'authenticate',
      });
      axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
      const res = await request(app)
        .post('/authenticate/date-of-birth')
        .type('form')
        .send({ day: '29', month: '06', year: '1985' });
      expect(res.statusCode).toEqual(500);
      expect(res.text).toContain('Sorry, there is a problem with the service');
    });
  it('It should render findr postcode', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'authenticate',
      previousPage: '/date-of-birth',
    });
    const res = await request(app).get('/authenticate/postcode');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your postcode?');
  });
  it('It should display error if no postcode entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    const res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your postcode');
  });
  it('It should display error if invalid postcode entered', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    const res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA1 1AAA&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter a real postcode');
  });
  it('It should redirect to /identity-verification/redirect if valid postcode entered', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Provide a journeyId?'));
    axios.request.mockRejectedValue(buildOIDCRedirectCallback());
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    let res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=A9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=A9 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=A99 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA99 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');

    // check postcode sanitisation
    res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=  A  a  999A  a   &callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toContain('/identity-verification/redirect');
  });
  it('It should display you cannot sign in to this service page if FindR service returns no match', async () => {
    axios.post.mockRejectedValue(buildError401Callback('FINDR_RECORD_NOT_FOUND'));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    const res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/authenticate/not-found');
  });

  it('should redirect to sign-in on downstream service if submit button pressed on "not found" page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('FINDR_RECORD_NOT_FOUND'));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    const res = await request(app)
      .post('/authenticate/not-found')
      .type('form')
      .send('');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(process.env.SIGNIN_LINK);
  });

  it('should render "more information needed" page if GUID does not match', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'GUIDS_DO_NOT_MATCH',
        },
      },
      status: 401,
    };
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/could-not-sign-in');
    expect(res.text).toContain('Found. Redirecting to /account-recovery/could-not-sign-in');
  });

  it('should render "more-info-needed" page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/postcode',
      journey: 'account-recovery',
    });
    const res = await request(app).get('/account-recovery/could-not-sign-in');
    expect(res.text).toContain('Sorry, we could not sign you in');
  });

  it('should redirect to service support button URL on downstream service if submit button pressed on "more info needed" page', async () => {
    axios.post.mockRejectedValue(buildError401Callback('FINDR_MORE_INFO_REQUIRED'));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
      previousPage: '/postcode',
    });
    const res = await request(app)
      .post('/authenticate/could-not-sign-in')
      .type('form')
      .send('');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(process.env.SERVICE_SUPPORT_BUTTON_URL);
  });

  it('should display "something has gone wrong page" if call to FindR service returns an error', async () => {
    axios.post.mockRejectedValue(buildError401Callback(''));
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'authenticate',
    });
    const res = await request(app)
      .post('/authenticate/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(401);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
});
