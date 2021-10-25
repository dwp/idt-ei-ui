/*
 * @jest-environment jsdom
 */

const { toHaveNoViolations } = require('jest-axe');
const request = require('supertest');
const express = require('express');
const axios = require('axios');
const axe = require('../lib/axe-helper');
const {
  buildSingleValueCallback,
} = require('../utils/callback-builder');

jest.mock('axios');

const app = require('../../app/app');

// function to inject values into req.session
const setSession = (selfServiceAppObj, sessionValues) => {
  const testApp = express();
  testApp.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  testApp.use(selfServiceAppObj);
  return testApp;
};
expect.extend(toHaveNoViolations);

describe('DWP Registration', () => {
  it('Landing page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Email page to have no violations', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback());
    const testApp = setSession(app, {
      currentPage: '/register/email',
    });
    const res = await request(testApp).get('/register/email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Resend email page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/verify-email',
    });
    const res = await request(testApp).get('/register/resend-email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Verify email page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/verify-email',
    });
    const res = await request(testApp).get('/register/verify-email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Email already registered page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/email-already-registered',
    });
    const res = await request(testApp).get('/register/email-already-registered');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Password page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/password',
    });
    const res = await request(testApp).get('/register/password');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Mobile page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/mobile',
    });
    const res = await request(testApp).get('/register/mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Verify mobile page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/verify-mobile',
    });
    const res = await request(testApp).get('/register/verify-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Registration complete page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/complete',
    });
    const res = await request(testApp).get('/register/complete');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Resend mobile page to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/register/verify-mobile',
    });
    const res = await request(testApp).get('/register/resend-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Start again page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/start-register-again');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Second Start again page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/start-again');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Start again expired otp page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/start-again-expired-otp');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Complete registration to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/register/resume-registration£');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
