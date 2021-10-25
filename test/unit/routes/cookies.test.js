const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { parse } = require('node-html-parser');

const {
  buildTwoValueCallback,
} = require('../../utils/callback-builder');

jest.mock('../../../app/middleware/csurf', () => ((req, res, next) => {
  next();
}));

jest.mock('axios');

// function to inject values into req.session
let sessionMock;
const setSession = (selfServiceAppObj, sessionValues) => {
  const app = express();
  app.use((req, res, next) => {
    sessionMock = { ...sessionValues };
    req.session = sessionMock;
    next();
  });
  app.use(selfServiceAppObj);
  return app;
};

const selfServiceApp = require('../../../app/app');

describe('cookies', () => {
  // ========== Main cookies page =============
  it('should render the cookies page', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/cookies');

    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Cookies are small files saved on your phone, tablet or computer when you visit a website.');
  });

  it('should include back link on cookies page, returning user to previous page', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/previous-page',
    });
    const res = await request(app)
      .get('/cookies');

    expect(res.statusCode).toEqual(200);

    const parsedHtml = parse(res.text);
    const htmlElement = parsedHtml.querySelector('.govuk-back-link');
    expect(htmlElement.attributes.href).toBe('/a-journey/previous-page');
  });

  it('should prepopulate "Do not use cookies that measure my website use" radio button if seen_cookie_message cookie is not set', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/cookies');

    expect(res.statusCode).toEqual(200);

    const parsedHtml = parse(res.text);

    const acceptRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'accept');
    expect(acceptRadio.hasAttribute('checked')).toBe(false);

    const rejectRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'reject');
    expect(rejectRadio.hasAttribute('checked')).toBe(true);
  });

  it('should prepopulate "Use cookies that measure my website use" radio button if seen_cookie_message is set to accept', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/cookies')
      .set('Cookie', ['seen_cookie_message=accept']);

    expect(res.statusCode).toEqual(200);

    const parsedHtml = parse(res.text);

    const acceptRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'accept');
    expect(acceptRadio.hasAttribute('checked')).toBe(true);

    const rejectRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'reject');
    expect(rejectRadio.hasAttribute('checked')).toBe(false);
  });

  it('should prepopulate  "Do not use cookies that measure my website use" radio button if seen_cookie_message cookie is set to reject', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/cookies')
      .set('Cookie', ['seen_cookie_message=reject']);

    expect(res.statusCode).toEqual(200);

    const parsedHtml = parse(res.text);

    const acceptRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'accept');
    expect(acceptRadio.hasAttribute('checked')).toBe(false);

    const rejectRadio = parsedHtml.querySelectorAll('.govuk-radios__input')
      .find((htmlElement) => htmlElement.attributes.value === 'reject');
    expect(rejectRadio.hasAttribute('checked')).toBe(true);
  });

  it('should set the seen_cookie_message cookie to accept if user selects allow analytic cookies on cookies page, with 1 year expiry', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'accept' });

    const seenCookieMessage = res.headers['set-cookie'].find((item) => item.includes('seen_cookie_message'));
    expect(seenCookieMessage).toContain('seen_cookie_message=accept');
    expect(seenCookieMessage).toContain('Max-Age=31536000'); // one year
    expect(seenCookieMessage).toContain('HttpOnly');
    expect(seenCookieMessage).toContain('Secure');
  });

  it('should set the seen_cookie_message cookie to reject if user selects do not allow analytic cookies on cookies page, with 1 year expiry', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'reject' });

    const seenCookieMessage = res.headers['set-cookie'].find((item) => item.includes('seen_cookie_message'));
    expect(seenCookieMessage).toContain('seen_cookie_message=reject');
    expect(seenCookieMessage).toContain('Max-Age=31536000'); // one year
    expect(seenCookieMessage).toContain('HttpOnly');
    expect(seenCookieMessage).toContain('Secure');
  });

  it('should delete analytic cookies when user selects to reject analytic cookies', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'reject' });

    const gaCookie = res.headers['set-cookie'].find((item) => item.includes('_ga'));
    const gatCookie = res.headers['set-cookie'].find((item) => item.includes('_gat'));
    const gidCookie = res.headers['set-cookie'].find((item) => item.includes('_gid'));
    expect(gaCookie).toContain('Max-Age=0');
    expect(gatCookie).toContain('Max-Age=0');
    expect(gidCookie).toContain('Max-Age=0');
  });

  it('should put setting in session to display the success panel when the user selects or rejects analytic cookies', async () => {
    let app = setSession(selfServiceApp);
    await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'accept' });

    expect(sessionMock.displayCookiesSuccessPanel).toBe(true);

    app = setSession(selfServiceApp);
    await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'reject' });

    expect(sessionMock.displayCookiesSuccessPanel).toBe(true);
  });

  it('should display the success panel if session shows user has just selected cookies preferences', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesSuccessPanel: true,
    });
    const res = await request(app)
      .get('/cookies');

    expect(res.text).toContain('You’ve set your cookie preferences.');
  });

  it('should include link to previous page in success panel', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesSuccessPanel: true,
      journey: 'a-journey',
      previousPage: '/previous-page',
    });
    const res = await request(app)
      .get('/cookies');

    const parsedHtml = parse(res.text);
    const htmlElement = parsedHtml.querySelector('.govuk-notification-banner__link');
    expect(htmlElement.attributes.href).toBe('/a-journey/previous-page');
  });

  it('should not display the success panel if session does not show user has just selected cookies preferences', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/cookies');

    expect(res.text.includes('You’ve set your cookie preferences.')).toBe(false);
  });

  it('should not set the seen_cookie_message cookie if anything received in POST other than accept or reject', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .post('/cookies')
      .send({ useAnalyticCookies: 'somthing else' });

    const seenCookieMessage = res.headers['set-cookie'].find((item) => item.includes('seen_cookie_message'));
    expect(seenCookieMessage).toBe(undefined);
  });

  // ========== Cookies banner =============
  it('should redirect to value set in journey and previous page session variables, when user selects option in cookie banner', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/some-page',
    });

    const res = await request(app)
      .post('/cookies/banner');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/a-journey/some-page');
  });

  it('should redirect to signin page if either current journey or previous page missing in session', async () => {
    process.env.SIGNIN_LINK = 'http://sign-in';

    let app = setSession(selfServiceApp, {
      journey: 'a-journey',
      // previousPage: '/some-page',
    });

    let res = await request(app)
      .post('/cookies/banner');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('http://sign-in');

    app = setSession(selfServiceApp, {
      // journey: 'a-journey',
      previousPage: '/some-page',
    });

    res = await request(app)
      .post('/cookies/banner');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('http://sign-in');
  });

  it('should set seen_cookie_message to "accept" if user selects accept in the cookie banner, with expiry one year', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/some-page',
    });

    const res = await request(app)
      .post('/cookies/banner')
      .send({ cookies: 'accept' });

    const seenCookieMessage = res.headers['set-cookie'].find((item) => item.includes('seen_cookie_message'));
    expect(seenCookieMessage).toContain('seen_cookie_message=accept');
    expect(seenCookieMessage).toContain('Max-Age=31536000'); // one year
    expect(seenCookieMessage).toContain('HttpOnly');
    expect(seenCookieMessage).toContain('Secure');
  });

  it('should set seen_cookie_message to "reject" if user selects reject in the cookie banner, with expiry one year', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/some-page',
    });

    const res = await request(app)
      .post('/cookies/banner')
      .send({ cookies: 'reject' });

    const seenCookieMessage = res.headers['set-cookie'].find((item) => item.includes('seen_cookie_message'));
    expect(seenCookieMessage).toContain('seen_cookie_message=reject');
    expect(seenCookieMessage).toContain('Max-Age=31536000'); // one year
    expect(seenCookieMessage).toContain('HttpOnly');
    expect(seenCookieMessage).toContain('Secure');
  });

  it('should not set seen_cookie_message cookie if something other than accept or reject received', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/some-page',
    });

    const res = await request(app)
      .post('/cookies/banner')
      .send({ cookies: 'something else' });
    expect(res.headers['set-cookie'].join().includes('seen_cookie_message')).toBe(false);
  });

  // tests required to confirm journey is set in session on each landing page
  // as this is used in redirecting user to correct page after selecting cookie preferences
  it('should set req.session.journey on landing page for each journey', async () => {
    const app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildTwoValueCallback('Username', 'Password'));
    await request(app)
      .get('/authenticate');
    expect(sessionMock.journey).toEqual('authenticate');

    await request(app)
      .get('/register');
    expect(sessionMock.journey).toEqual('register');

    await request(app)
      .get('/password-reset');
    expect(sessionMock.journey).toEqual('password-reset');

    await request(app)
      .get('/account-recovery/start-update-mobile');
    expect(sessionMock.journey).toEqual('account-recovery');
  });

  // tests required to confirm previous page is set in session on sample journey pages
  // as this is used in redirecting user to correct page after making cookie choices
  it('should set req.session.journey on landing page for each journey', async () => {
    let app = setSession(selfServiceApp);
    axios.post.mockResolvedValue(buildTwoValueCallback('Username', 'Password'));
    await request(app)
      .get('/authenticate');
    expect(sessionMock.previousPage).toEqual('/');

    app = setSession(selfServiceApp, {
      previousPage: '/',
    });
    await request(app)
      .get('/authenticate/verify-mobile');
    expect(sessionMock.previousPage).toEqual('/verify-mobile');

    app = setSession(selfServiceApp, {
      previousPage: '/verify-email',
    });
    await request(app)
      .get('/register/email-already-registered');
    expect(sessionMock.previousPage).toEqual('/email-already-registered');

    app = setSession(selfServiceApp, {
      previousPage: '/email-address',
    });
    await request(app)
      .get('/password-reset/verify-email');
    expect(sessionMock.previousPage).toEqual('/verify-email');

    app = setSession(selfServiceApp, {
      previousPage: '/name',
    });
    await request(app)
      .get('/account-recovery/date-of-birth');
    expect(sessionMock.previousPage).toEqual('/date-of-birth');
  });

  it('should display cookie banner if seen_cookie_message cookie not set', async () => {
    const app = setSession(selfServiceApp);
    // register is just a sample page
    const res = await request(app)
      .get('/register');

    expect(res.text).toContain('Cookies on DWP login and identification service');
  });

  it('should not display cookie banner if seen_cookie_message cookie has been set', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);

    expect(res.text.includes('Cookies on DWP login and identification service')).toBe(false);
  });

  it('should include google analytics code snippet if seen_cookie_message cookie set to accept', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);

    expect(res.text).toContain('GoogleAnalyticsObject');
  });

  it('should include not google analytics code snippet if seen_cookie_message cookie not set to accept', async () => {
    const app = setSession(selfServiceApp);
    const res = await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=reject']);

    expect(res.text.includes('GoogleAnalyticsObject')).toBe(false);
  });

  it('should display the "you have accepted cookies" message if user has just accepted cookies', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesAcceptance: true,
    });
    const res = await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);

    expect(res.text).toContain('You’ve accepted additional cookies.');
  });

  it('should display the "you have rejected cookies" message if user has just rejected cookies', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesRejection: true,
    });
    const res = await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=reject']);

    expect(res.text).toContain('You’ve rejected additional cookies.');
  });

  it('should set session variable to hide "you have accepted cookies" message when user selects "Hide message"', async () => {
    const app = setSession(selfServiceApp, {
      cookiesRedirect: '/page/redirect',
      displayCookiesAcceptance: true,
    });
    await request(app)
      .post('/cookies/hide-message');

    expect(sessionMock.displayCookiesAcceptance).toBe(false);
  });

  it('should set session variable to hide "you have rejected cookies" message when user selects hide message', async () => {
    const app = setSession(selfServiceApp, {
      cookiesRedirect: '/page/redirect',
      displayCookiesRejection: true,
    });
    await request(app)
      .post('/cookies/hide-message')
      .set('Cookie', ['seen_cookie_message=reject']);

    expect(sessionMock.displayCookiesRejection).toBe(false);
  });

  it('should prevent "you have accepted cookies" message from displaying on subsequent pages', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesAcceptance: true,
    });
    await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=accept']);

    expect(sessionMock.displayCookiesAcceptance).toBe(false);
  });

  it('should prevent "you have rejected cookies" message from displaying on subsequent pages', async () => {
    const app = setSession(selfServiceApp, {
      displayCookiesRejection: true,
    });
    await request(app)
      .get('/register')
      .set('Cookie', ['seen_cookie_message=reject']);

    expect(sessionMock.displayCookiesRejection).toBe(false);
  });

  it('should redirect to correct page when user selects hide cookie acceptance message', async () => {
    const app = setSession(selfServiceApp, {
      journey: 'a-journey',
      previousPage: '/some-page',
    });
    const res = await request(app)
      .post('/cookies/hide-message');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('/a-journey/some-page');
  });

  it('should redirect to signin page if either current journey or previous page missing in session', async () => {
    process.env.SIGNIN_LINK = 'http://sign-in';

    let app = setSession(selfServiceApp, {
      journey: 'a-journey',
      // previousPage: '/some-page',
    });

    let res = await request(app)
      .post('/cookies/hide-message');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('http://sign-in');

    app = setSession(selfServiceApp, {
      // journey: 'a-journey',
      previousPage: '/some-page',
    });

    res = await request(app)
      .post('/cookies/hide-message');

    expect(res.statusCode).toEqual(302);
    expect(res.get('Location')).toEqual('http://sign-in');
  });
});
