const checkCurrentPageCorrect = require('../../../app/middleware/valid-page-transitions/check-current-page-correct');

jest.mock('../../../app/middleware/valid-page-transitions/valid-page-transitions.json', () => ({
  'a-journey': {
    exemptPages: ['/an-exempt-page'],
    startAgainPath: '/start-again-path',
    validTransitions: [{
      previousPage: '/a-previous-page',
      permittedCurrentPages: [
        '/a-valid-current-page',
      ],
    }],
  },
}), { virtual: true });

let reqMock;
let resMock;
const nextMock = jest.fn();
const redirectMock = jest.fn();
const destroySession = jest.fn();
destroySession.mockImplementation((callback) => {
  callback();
});

describe('Check current page is correct', () => {
  beforeEach(() => {
    reqMock = {
      method: 'GET',
      session: {
        destroy: destroySession,
      },
      url: '/default-path',
    };
    resMock = {
      redirect: redirectMock,
    };
  });

  it('should just call next if method is a POST', () => {
    reqMock.method = 'POST';
    checkCurrentPageCorrect('a-journey')(reqMock, {}, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should just set previous page in session and call next if page is exempt from checking its validity', () => {
    reqMock.url = '/an-exempt-page';
    checkCurrentPageCorrect('a-journey')(reqMock, {}, nextMock);
    expect(reqMock.session.previousPage).toEqual('/an-exempt-page');
    expect(nextMock).toHaveBeenCalled();
  });

  it('should destroy session and start again if no previous page found in session', () => {
    checkCurrentPageCorrect('a-journey')(reqMock, resMock, {});
    expect(destroySession).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/start-again-path');
  });

  it('should just call next if user remains on same page but has toggled to different language', () => {
    reqMock.session.previousPage = '/a-page-the-user-is-on';
    reqMock.url = '/a-page-the-user-is-on?lng=cn';
    checkCurrentPageCorrect('a-journey')(reqMock, resMock, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should destroy session and start again if previous page not found in list', () => {
    reqMock.session.previousPage = '/previous-page-not-listed';
    checkCurrentPageCorrect('a-journey')(reqMock, resMock, {});
    expect(destroySession).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/start-again-path');
  });

  it('should destroy session and start again if current page is not a valid transition from previous page', () => {
    reqMock.session.previousPage = '/a-previous-page';
    reqMock.url = '/a-current-page-not-listed';
    checkCurrentPageCorrect('a-journey')(reqMock, resMock, {});
    expect(destroySession).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/start-again-path');
  });

  it('should set previous page in session and call next if page is a valid transition from previous page', () => {
    reqMock.session.previousPage = '/a-previous-page';
    reqMock.url = '/a-valid-current-page';
    checkCurrentPageCorrect('a-journey')(reqMock, resMock, nextMock);
    expect(reqMock.session.previousPage).toEqual('/a-valid-current-page');
    expect(nextMock).toHaveBeenCalled();
  });
});
