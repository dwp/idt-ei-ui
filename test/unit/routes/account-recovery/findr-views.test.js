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
session.mockImplementation(() => { });

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

describe('account recovery - findr', () => {
  it('It should render enter name page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    const res = await request(app).get('/account-recovery/name');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your name?');
  });
  it('Name does not pass validation errors', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('First name'));
    let res = await request(app)
      .post('/account-recovery/name')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your first name');
    expect(res.text).toContain('Enter your last name');

    res = await request(app)
      .post('/account-recovery/name')
      .type('form')
      .send({ 'callbacks[0]': 'John@', 'callbacks[1]': 'Smith2' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('First name must only include letters a to z, hyphens, spaces and apostrophes');
    expect(res.text).toContain('Last name must only include letters a to z, hyphens, spaces and apostrophes');
  });
  it('It should redirect to date of birth page', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Day'));
    const res = await request(app)
      .post('/account-recovery/name')
      .type('form')
      .send({ 'callbacks[0]': 'Bèrgström', 'callbacks[1]': 'Pâté' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/date-of-birth');
  });
  it('It should render error page if Day prompt not received from ForgeRock', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
    const res = await request(app)
      .post('/account-recovery/name')
      .type('form')
      .send({ 'callbacks[0]': 'John', 'callbacks[1]': 'Smith' });
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render account-recovery verify-date-of-birth page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/name',
      journey: 'account-recovery',
    });
    const res = await request(app).get('/account-recovery/date-of-birth');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your date of birth?');
  });
  it('Date of birth does not pass validation errors', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '', month: '', year: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '', month: '06', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your date of birth');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '32', month: '02', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '13', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '32', month: '13', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '02', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '31', month: '9', year: '1985' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: 'aa', month: 'aa', year: 'aa' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be a real date');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '85' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Year must be 4 digits');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '3024' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Date of birth must be in the past');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '06', year: '1800' });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Check the year you were born');
  });

  it('It should redirect to Postcode if valid date added', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29', month: '02', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '31', month: '01', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');
  });

  it('It should redirect to Postcode if valid date added with leading white space', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: ' 29', month: ' 02', year: '  2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '31', month: '01', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');
  });

  it('It should redirect to Postcode if valid date added with trailing white space', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '29 ', month: '02  ', year: '2000 ' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '31', month: '01', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');
  });

  it('It should redirect to Postcode if valid date added with white spaces inside', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Postcode'));
    let res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: ' 1 2 ', month: '  0 7', year: '20 20  ' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');

    res = await request(app)
      .post('/account-recovery/date-of-birth')
      .type('form')
      .send({ day: '31', month: '01', year: '2000' });
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/postcode');
  });

  it('Name: it should render error page if postcode prompt not received from ForgeRock',
    async () => {
      const app = setSession(selfServiceApp, {
        payload: { callbacks: [] },
        journey: 'account-recovery',
      });
      axios.post.mockResolvedValue(buildSingleValueCallback('Wrong prompt'));
      const res = await request(app)
        .post('/account-recovery/date-of-birth')
        .type('form')
        .send({ day: '29', month: '06', year: '1985' });
      expect(res.statusCode).toEqual(500);
      expect(res.text).toContain('Sorry, there is a problem with the service');
    });
  it('It should render account-recovery postcode', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/date-of-birth',
      journey: 'account-recovery',
    });
    const res = await request(app).get('/account-recovery/postcode');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('What is your postcode?');
  });
  it('Postcode validation', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'account-recovery',
    });
    let res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter your postcode');

    res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=AA&& 9AA&callbacks=');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Enter a real postcode');
  });
  it('It should render error page if Mobile number prompt not received', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('wrongPrompt'));
    const res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should redirect to new-mobile-number page after call to findr if ForgeRock requests Mobile Number', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    axios.post.mockResolvedValue(buildSingleValueCallback('Mobile number'));
    const res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual('/account-recovery/new-mobile-number');
  });
  it('It should redirect to "Sorry you can\'t signin page" if no match received from findr', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    const err = new Error();
    err.response = {
      data: {
        detail: {
          failureUrl: 'FINDR_RECORD_NOT_FOUND',
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
    expect(res.headers.location).toEqual('/account-recovery/not-found');
  });
  it('should redirect to "more info needed" page if AM Guid does not match Findr GUID', async () => {
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
    expect(res.headers.location).toEqual('/account-recovery/could-not-sign-in');
    expect(res.text).toContain('Found. Redirecting to /account-recovery/could-not-sign-in');
  });

  it('should render error page if unexpected error found in postcode POST route', async () => {
    const app = setSession(selfServiceApp, {
      payload: { callbacks: [] },
      journey: 'account-recovery',
    });
    const err = new Error('Unexpected error');
    axios.post.mockImplementation(() => {
      throw err;
    });
    const res = await request(app)
      .post('/account-recovery/postcode')
      .type('form')
      .send('callbacks=AA9A 9AA&callbacks=');
    expect(res.statusCode).toEqual(500);
    expect(res.text).toContain('Sorry, there is a problem with the service');
  });
  it('It should render findr not found page', async () => {
    const app = setSession(selfServiceApp, {
      previousPage: '/postcode',
      journey: 'account-recovery',
    });
    const res = await request(app).get('/account-recovery/not-found');
    expect(res.text).toContain('Sorry, we could not sign you in');
  });
});
