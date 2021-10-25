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
  const sessionApp = express();
  sessionApp.use((req, res, next) => {
    req.session = { ...sessionValues };
    next();
  });
  sessionApp.use(selfServiceAppObj);
  return sessionApp;
};
expect.extend(toHaveNoViolations);

describe('DWP Authentication', () => {
  it('Landing page to have no violations', async () => {
    axios.post.mockResolvedValue(buildSingleValueCallback());
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Verify mobile to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/authenticate/verify-mobile',
    });
    const res = await request(testApp).get('/authenticate/verify-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Resend mobile mobile to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/authenticate/verify-mobile',
    });
    const res = await request(testApp).get('/authenticate/resend-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Temporary Lockout to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/temporary-lockout',
    });
    const res = await request(testApp).get('/temporary-lockout');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Temporary Lockout SMS to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/temporary-lockout-sms',
    });
    const res = await request(testApp).get('/temporary-lockout-sms');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Still Lockout Out to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/still-locked-out',
    });
    const res = await request(testApp).get('/still-locked-out');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Start again to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/authenticate/start-again',
    });
    const res = await request(testApp).get('/authenticate/start-again');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Last login to have no violations', async () => {
    const testApp = setSession(app, {
      currentPage: '/authenticate/last-login',
    });
    const res = await request(testApp).get('/authenticate/last-login');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
