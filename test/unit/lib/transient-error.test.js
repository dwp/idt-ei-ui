const {
  setTransientError,
  getTransientError,
} = require('../../../app/lib/transient-error');

describe('transient error handling', () => {
  it('sets and gets a transient error on the request session', () => {
    const req = { session: {} };
    const error = {
      code: 808,
      text: 'this is an error',
    };
    setTransientError(req, error);
    expect(req.session.transientError)
      .toEqual(error);

    const transientError = getTransientError(req);
    expect(transientError)
      .toEqual(error);

    const shouldBeUndefined = getTransientError(req);
    expect(shouldBeUndefined)
      .toEqual(undefined);
  });
});
