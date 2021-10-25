const axios = require('axios');
const {
  registrationApi,
  authenticationApi,
  passwordResetApi,
  accountRecoveryApi,
} = require('../../../app/lib/am-api');

jest.mock('axios');

const noHeaderRequest = {
  headers: {},
  cookies: {},
};

const headerRequest = {
  headers: {
    'user-agent': 'user-agent-value',
    'x-session-id': 'x-session-id-value',
    'x-correlation-id': 'x-correlation-id-value',
    'x-forwarded-for': 'x-forwarded-for-value',
  },
  cookies: {},
};

const headerTests = (apiName, functionUnderTest) => {
  describe(`${apiName} Tests`, () => {
    it('should contain specified headers when request headers are present', async () => {
      await functionUnderTest(headerRequest);
      expect(axios.post).toHaveBeenCalledWith(expect.anything(), undefined, {
        headers: expect.objectContaining({
          'User-Agent': 'user-agent-value',
          'X-Session-ID': 'x-session-id-value',
          'X-Correlation-ID': 'x-correlation-id-value',
          'X-Forwarded-For': 'x-forwarded-for-value',
          'Content-Type': 'application/json',
          language: 'en',
          'Accept-API-Version': 'protocol=1.0,resource=2.1',
        }),
      });
    });
    it('should not contain specified headers when request headers are not present', async () => {
      await functionUnderTest(noHeaderRequest);
      expect(axios.post).toHaveBeenCalledWith(expect.anything(), undefined, {
        headers: expect.not.objectContaining({
          'User-Agent': expect.anything(),
          'X-Session-ID': expect.anything(),
          'X-Correlation-ID': expect.anything(),
          'X-Forwarded-For': expect.anything(),
        }),
      });
      expect(axios.post).toHaveBeenCalledWith(expect.anything(), undefined, {
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          language: 'en',
          'Accept-API-Version': 'protocol=1.0,resource=2.1',
        }),
      });
    });
  });
};

describe('AM Api Calls', () => {
  headerTests('Registraton', registrationApi);
  headerTests('Authentication', authenticationApi);
  headerTests('Password Reset', passwordResetApi);
  headerTests('Account Recovery', accountRecoveryApi);
});
