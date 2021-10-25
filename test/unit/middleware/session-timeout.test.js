const { checkSessionTimeout } = require('../../../app/middleware/session-timeout');

jest.mock('../../../app/lib/logger', () => () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
}));

describe('Session timeout unit tests', () => {
  const TWENTY_MINUTES = 1000 * 60 * 20;
  process.env.PAGE_SESSION_TIMEOUT = TWENTY_MINUTES.toString();
  const FOUR_HOURS = 1000 * 60 * 60 * 4;
  process.env.JOURNEY_SESSION_TIMEOUT = FOUR_HOURS.toString();

  let redirectMock;
  let reqMock;
  let resMock;
  let nextMock;

  beforeEach(() => {
    redirectMock = jest.fn();
    resMock = { redirect: redirectMock };
    reqMock = {
      session: {
        pageLoadTimeStamp: 100000,
        startJourneyTimeStamp: 5000,
      },
      method: 'POST',
      originalUrl: 'password-reset',
      body: {
        js: 'false',
      },
    };
    nextMock = jest.fn();
  });

  it('should redirect to timeout page if req.session does not exist', async () => {
    delete reqMock.session;
    await checkSessionTimeout(reqMock, resMock, nextMock);
    expect(redirectMock).toHaveBeenCalledWith('/password-reset/session-timeout');
  });

  it('should redirect to timeout page if javascript enabled, but absolute journey timeout exceeded on POST', async () => {
    const dateMock = function dateMock() {};
    reqMock.body.js = 'true';
    // set current time to: journey start time plus four hours plus one second
    dateMock.getTime = () => 5000 + (FOUR_HOURS) + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, resMock, () => {});
    expect(redirectMock).toHaveBeenCalledWith('/password-reset/session-timeout');
  });

  it('should redirect to timeout page if timeout exceeded on POST', async () => {
    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes plus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, resMock, () => {});
    expect(redirectMock).toHaveBeenCalledWith('/password-reset/session-timeout');
  });

  it('should throw error if session timeout path not found', async () => {
    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes plus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    reqMock.originalUrl = 'something-not-found';

    try {
      await checkSessionTimeout(reqMock, resMock, () => {});
    } catch (e) {
      expect(e.message).toBe('Attempting to redirect to session timeout page, but session timeout path not found');
      return;
    }
    throw new Error('Expected error not thrown');
  });

  it('should just call next if timeout exceeded but page is exempt', async () => {
    reqMock.originalUrl = '/password-reset'; // exempt page

    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes plus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, resMock, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should just call next if timeout exceeded but javascript is enabled', async () => {
    reqMock.body.js = 'true';

    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes plus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, resMock, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should assume javascript not enabled and check for timeout, if req.body.js not set', async () => {
    delete reqMock.body.js;

    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes plus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES + 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, resMock, nextMock);
    expect(redirectMock).toHaveBeenCalledWith('/password-reset/session-timeout');
  });

  it('should just call next if timeout not exceeded and request is not a GET', async () => {
    reqMock.method = 'POST';

    const dateMock = function dateMock() {};
    // set current time to: page load time plus twenty minutes minus one second
    dateMock.getTime = () => 100000 + TWENTY_MINUTES - 1000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, () => {}, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should set page load timestamp to current time, and call next, if request is a GET', async () => {
    reqMock.method = 'GET';

    const dateMock = function dateMock() {};
    dateMock.getTime = () => 100000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, () => {}, nextMock);
    expect(reqMock.session.pageLoadTimeStamp).toEqual(100000);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should set journey start timestamp to current time, if GET called on a "start" page', async () => {
    reqMock.method = 'GET';
    reqMock.originalUrl = '/password-reset/email-address'; // journey start page

    const dateMock = function dateMock() {};
    dateMock.getTime = () => 100000;

    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => dateMock);

    await checkSessionTimeout(reqMock, () => {}, nextMock);
    expect(reqMock.session.startJourneyTimeStamp).toEqual(100000);
    expect(nextMock).toHaveBeenCalled();
  });
});
