const request = require('supertest');
const express = require('express');
const axios = require('axios');
const session = require('../../../app/middleware/session');
const {
  buildSuccessfulAuthenticationCallback,
  buildSingleValueCallback,
  buildOIDCRedirectCallback,
} = require('../../utils/callback-builder');

jest.mock('../../../app/middleware/session');
jest.mock('axios');

// bypass session
session.mockImplementation(() => {});

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  const sessionApp = express();
  sessionApp.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  sessionApp.use(selfServiceAppObj);
  return sessionApp;
};

const app = require('../../../app/app');

describe('Continue - exit point from HMRC IV', () => {
  it('check that a journeyId is returned and render the sign-in', async () => {
    const testApp = setSession(app, {
      payload: {
        callbacks: [
          {
            input: [
              {
                value: 'JOURNEY ID',
              },
            ],
          },
        ],
      },
      // resave: (callback) => {
      //   callback();
      // },
    });
    axios.post.mockResolvedValue({
      data: {},
    });
    axios.post.mockResolvedValue(buildSuccessfulAuthenticationCallback());
    axios.request.mockRejectedValue(buildOIDCRedirectCallback());
    const res = await request(testApp).get('/identity-verification/continue?journeyId=407fba75-2972-4a8b-917e-f5189252ce28');
    // expect(res.text).toContain('Redirecting to http://localhost:5000/success');
    expect(res.statusCode).toBe(302);
  });
  it('check that a journeyId is returned and return error if unable to connect to ForgeRock', async () => {
    const testApp = setSession(app, {
      payload: {
        callbacks: [
          {
            input: [
              {
                value: '',
              },
            ],
          },
        ],
      },
    });
    axios.post.mockRejectedValue(new Error('Error!'));
    const res = await request(testApp).get('/identity-verification/continue?journeyId=407fba75-2972-4a8b-917e-f5189252ce28');
    expect(res.statusCode).toBe(500);
    // expect(res.text).toContain('http://localhost:5000/failure?failureReason=Error!');
  });

  it('check that a journeyId is returned and return error if unable to connect to OIDC', async () => {
    const testApp = setSession(app, {
      payload: {
        callbacks: [
          {
            input: [
              {
                value: '',
              },
            ],
          },
        ],
      },
    });
    axios.post.mockResolvedValue(buildSuccessfulAuthenticationCallback());
    axios.post.mockRejectedValue(new Error('Error!'));
    const res = await request(testApp).get('/identity-verification/continue?journeyId=407fba75-2972-4a8b-917e-f5189252ce28');
    expect(res.statusCode).toBe(500);
    // expect(res.text).toContain('http://localhost:5000/failure?failureReason=Error!');
  });
  it.skip('check that a journeyId is returned and return error if there is an error caught while saving to request session', async () => {
    const testApp = setSession(app, {
      payload: {
        callbacks: [
          {
            input: [
              {
                value: '',
              },
            ],
          },
        ],
      },
      resave: (callback) => {
        callback(new Error('Error!'));
      },
    });
    axios.post.mockResolvedValue({
      data: {},
    });
    const res = await request(testApp).get('/identity-verification/continue?journeyId=407fba75-2972-4a8b-917e-f5189252ce28');
    expect(res.statusCode).toBe(500);
  });
  it('renders error page when no journeyId is returned', async () => {
    const testApp = setSession(app, {
      payload: {
        callbacks: [
          {
            input: [
              {
                value: '',
              },
            ],
          },
        ],
      },
    });
    const res = await request(testApp).get('/identity-verification/continue?journeyId=');
    expect(res.text).toContain('Try again later');
  });

  it('should redirect to IDV page if idv is needed', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback('Provide a journeyId?'));
    const testApp = setSession(app);
    const res = await request(testApp)
      .get('/identity-verification/continue?journeyId=407fba75-2972-4a8b-917e-f5189252ce28');
    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/identity-verification/redirect');
  });
});
