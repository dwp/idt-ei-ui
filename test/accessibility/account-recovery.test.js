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
describe('DWP Account Recovery', () => {
  it('Account Recovery landing page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/account-recovery');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
