/*
 * @jest-environment jsdom
 */

const { toHaveNoViolations } = require('jest-axe');
const request = require('supertest');
const express = require('express');
const axe = require('../lib/axe-helper');

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

describe('Support pages', () => {
  it('Cookies page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/cookies');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('Cookies page to have no violations including success panel', async () => {
    const testApp = setSession(app, {
      displayCookiesSuccessPanel: true,
    });
    const res = await request(testApp).get('/cookies');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('User Journey page to have no violations with cookies banner displayed', async () => {
    const testApp = setSession(app);
    // register is sample page from user journey
    const res = await request(testApp).get('/register');
    // seen_cookie_message not set, will display cookies banner
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('User Journey page to have no violations with cookies banner not displayed', async () => {
    const testApp = setSession(app);
    // register is sample page from user journey
    const res = await request(testApp)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);
    // seen_cookie_message set, will not display cookies banner
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });

  it('User Journey page to have no violations with cookies acceptance banner displayed', async () => {
    const testApp = setSession(app, {
      displayCookiesAcceptance: true,
    });
    // register is sample page from user journey
    const res = await request(testApp)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);
    // seen_cookie_message set, will not display cookies banner;
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
