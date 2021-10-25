const csurfMock = require('csurf');
const csurfMiddleware = require('../../../app/middleware/csurf');
const { findTimeoutPage } = require('../../../app/middleware/session-timeout');

jest.mock('../../../app/lib/logger', () => () => ({
  error: () => {},
}));

jest.mock('csurf');
csurfMock.mockImplementation(() => (req, res, next) => {
  next();
});

jest.mock('../../../app/middleware/session-timeout');
findTimeoutPage.mockImplementation(() => 'session-timeout-path');

describe('csurf middleware unit tests', () => {
  it('should call csurf if req.method is a GET', () => {
    const reqMock = { method: 'GET' };
    csurfMiddleware[0](reqMock, {}, () => {});
    expect(csurfMock).toHaveBeenCalled();
  });
  it('should call csurf if req.method is a POST and req.session.csrfSecret exists', () => {
    const reqMock = {
      method: 'POST',
      session: {
        csrfSecret: 'a-token',
      },
    };
    csurfMiddleware[0](reqMock, {}, () => {});
    expect(csurfMock).toHaveBeenCalled();
  });
  it('should redirect to session timeout page if method is POST and req.session.csrf does not exist', () => {
    const reqMock = {
      method: 'POST',
      session: {},
    };
    const redirectMock = jest.fn();
    const resMock = {
      redirect: redirectMock,
    };
    csurfMiddleware[0](reqMock, resMock, () => {});
    expect(redirectMock).toHaveBeenCalledWith('session-timeout-path');
  });
  it('should set res locals csrf to token to response from csrf token function', () => {
    const reqMock = {
      csrfToken: () => 'a-csrf-token',
    };
    const resMock = {
      locals: {},
    };
    csurfMiddleware[1](reqMock, resMock, () => {});
    expect(resMock.locals.csrfToken).toBe('a-csrf-token');
  });
});
