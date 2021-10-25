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

describe('DWP Findr', () => {
  it('findr name page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate/name');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('findr date-of-birth page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate/date-of-birth');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('findr postcode page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/authenticate/postcode');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
