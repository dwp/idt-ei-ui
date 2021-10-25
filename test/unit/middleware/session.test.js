/* eslint-disable max-classes-per-file */
const session = require('../../../app/middleware/session');

jest.mock('../../../app/lib/logger', () => () => ({
  info: () => {},
  warn: () => {},
  error: () => {},
}));

describe('session middleware', () => {
  test('should use default store when no redis details are supplied', () => {
    const conf = {
      SESSION_SECRET: 'test',
      COOKIE_NAME: 'test',
    };
    const app = {
      use: () => {},
    };
    session(app, conf);
  });

  test('should use redis when details are supplied', () => {
    const conf = {
      SESSION_SECRET: 'test',
      COOKIE_NAME: 'test',
      REDIS_HOST: 'redis-host',
      REDIS_PORT: 7000,
    };
    const app = {
      use: () => {},
    };
    const Redis = class {
      constructor() {} // eslint-disable-line

      on() {
        return this;
      }
    };
    Redis.Cluster = class {
      constructor() {} // eslint-disable-line

      on() {
        return this;
      }
    };
    session(app, conf, Redis);
  });

  test('should try connecting 20 times before exiting', () => {
    jest.spyOn(process, 'exit').mockImplementation(() => {});
    const conf = {
      SESSION_SECRET: 'test',
      COOKIE_NAME: 'test',
      REDIS_HOST: 'redis-host',
      REDIS_PORT: '7000',
      REDIS_CLUSTER: 'true',
    };
    process.env.LOG_LEVEL = 'error';
    const app = {
      use: () => {},
    };
    const Redis = class {
      constructor() {} // eslint-disable-line

      on() {
        return this;
      }
    };
    Redis.Cluster = class {
      constructor() {} // eslint-disable-line

      on(evt, callback) {
        if (evt === 'error') {
          for (let i = 0; i <= 20; i++) {
            callback({ message: 'test' });
          }
        }
        return this;
      }
    };
    session(app, conf, Redis);
  });
});
