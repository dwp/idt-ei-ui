const request = require('supertest');
const express = require('express');
const app = require('../../../app/app');

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

describe('Support pages', () => {
  it('should render accessibility statement', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/accessibility-statement');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Accessibility statement for the DWP login and identification service');
  });

  it('should display back link, with link back to existing page in accessibility statement', async () => {
    const testApp = setSession(app, {
      journey: 'a-journey',
      previousPage: '/previous-page',
    });
    const res = await request(testApp).get('/accessibility-statement');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('<a href="a-journey/previous-page" class="govuk-back-link">Back</a>');
  });

  it('should redirect to home sign in page if either journey or previous page are missing in session', async () => {
    process.env.SIGNIN_LINK = 'http://sign-in';

    let testApp = setSession(app, {
      // journey: 'a-journey',
      previousPage: '/previous-page',
    });
    let res = await request(testApp).get('/accessibility-statement');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('<a href="http://sign-in" class="govuk-back-link">Back</a>');

    testApp = setSession(app, {
      journey: 'a-journey',
      // previousPage: '/previous-page',
    });
    res = await request(testApp).get('/accessibility-statement');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('<a href="http://sign-in" class="govuk-back-link">Back</a>');
  });
});
