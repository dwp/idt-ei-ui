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

describe('DWP Password Reset', () => {
  it('Password reset Landing page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset email address page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/email-address');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset verify email address page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/verify-email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset resend email address page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/resend-email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset resend email address page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/resend-email');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset email not registered page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/email-not-registered');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset reenter email address page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/reenter-email-address');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset password changed recently page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/password-changed-recently');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset new password page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/new-password');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset verify mobile page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/verify-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset resend mobile page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/resend-mobile');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset success page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/success');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset start again page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/start-again');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset session timeout page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/session-timeout');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset problem page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/problem');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset temporary lockout page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/temporary-lockout');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
  it('Password reset still locked out page to have no violations', async () => {
    const testApp = setSession(app);
    const res = await request(testApp).get('/password-reset/still-locked-out');
    const render = () => res.text;
    const html = render();
    expect(await axe(html)).toHaveNoViolations();
  });
});
