const axios = require('axios');

jest.mock('axios');

const {
  buildHTMLValueCallback, buildOIDCRedirectCallback, buildSuccessfulAuthenticationCallback,
} = require('../../utils/callback-builder');

const {
  completeAuthentication,
  sendToDownstreamService,
} = require('../../../app/lib/oidc-utils');

describe('OIDC Utils', () => {
  let redirectMock;
  let reqMock;
  let resMock;
  let cookieMock;

  beforeEach(() => {
    redirectMock = jest.fn();
    cookieMock = jest.fn();
    resMock = { redirect: redirectMock, cookie: cookieMock };
    reqMock = {
      session: {},
      cookies: {},
    };
  });

  it('User is redirected to last login page if last login date is available', () => {
    const result = buildHTMLValueCallback();
    completeAuthentication(reqMock, resMock, result);
    expect(reqMock.session.lastLogin.time).toMatch('12:32pm');
    expect(reqMock.session.lastLogin.date).toMatch('23 Aug 2021');
    expect(resMock.redirect).toHaveBeenCalledWith('/authenticate/last-login');
    expect(resMock.redirect).toHaveBeenCalledTimes(1);
  });

  it('Redirect to downstream service when last login page is submitted with a valid session and cookie', () => {
    const result = buildSuccessfulAuthenticationCallback();
    axios.request.mockRejectedValue(buildOIDCRedirectCallback());
    sendToDownstreamService(reqMock, resMock, result);
    expect(reqMock.session.payload).toEqual(result.data);
    expect(reqMock.session[process.env.SSO_HEADER_NAME]).toMatch(result.data.tokenId);
    expect(reqMock.session.currentPage).toMatch(process.env.SIGNIN_LINK);
    expect(cookieMock).toHaveBeenCalledWith(
      process.env.SSO_HEADER_NAME, result.data.tokenId, { httpOnly: true },
    );
    expect(cookieMock).toHaveBeenCalledTimes(1);
  });
});
