const middleware = require('../../../app/middleware/set-auth-state');

describe('Set Authencitated State Middleware', () => {
  it('isAuthenticated is set to false when request session does not contain a token', async () => {
    const nextMock = jest.fn();
    const req = { session: {}, path: '' };
    const res = { locals: {} };

    middleware(req, res, nextMock);

    expect(res.locals.isAuthenticated).toEqual(false);
    expect(nextMock).toHaveBeenCalled();
  });

  it('isAuthenticated is set to false when accessing authentication pages', async () => {
    const nextMock = jest.fn();
    const req = { session: {}, path: '/authenticate' };
    const res = { locals: {} };

    middleware(req, res, nextMock);

    expect(res.locals.isAuthenticated).toEqual(false);
    expect(nextMock).toHaveBeenCalled();
  });

  it('isAuthenticated is set to true when request session does not contain a token', async () => {
    const nextMock = jest.fn();
    const req = { session: {}, path: '' };
    const res = { locals: {} };
    req.session[process.env.SSO_HEADER_NAME] = 'SomeTokenValue';

    middleware(req, res, nextMock);

    expect(res.locals.isAuthenticated).toEqual(true);
    expect(nextMock).toHaveBeenCalled();
  });
});
