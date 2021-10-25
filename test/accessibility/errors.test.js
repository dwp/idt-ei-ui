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

describe('DWP Errors', () => {
  it('findr error page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/errors/500.njk');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Error page for error-401 to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/errors/401.njk');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Error page for error-403 to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/errors/403.njk');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Error page for error-404 to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/errors/404.njk');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
