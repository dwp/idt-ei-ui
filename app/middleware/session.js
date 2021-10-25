const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);

const logger = require('../lib/logger')();

module.exports = (app, config, Redis) => {
  const sessionConf = {
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.SECURE_COOKIE === 'true',
    },
    name: config.COOKIE_NAME,
    unset: 'destroy',
  };

  let redisClient = {};
  if (config.REDIS_HOST && config.REDIS_PORT) {
    logger.info(`Using Redis session store on ${config.REDIS_HOST}:${config.REDIS_PORT}`);
    redisClient = (config.REDIS_CLUSTER === 'true') ? new Redis.Cluster([{
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    }], {
      dnsLookup: (address, callback) => callback(null, address),
      redisOptions: {
        tls: {},
        password: config.REDIS_AUTH_TOKEN,
        db: 0,
      },
    }) : new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_AUTH_TOKEN,
      db: 0,
    });

    let retryCount = 0;
    const REDIS_MAX_RETRY = 20;
    redisClient.on('error', (err) => {
      logger.warn(`Redis error; will retry connection ${err.message}`);
      retryCount += 1;
      if (retryCount > REDIS_MAX_RETRY) {
        logger.error('Redis could not recover from error; exiting');
        process.exit(1);
      }
    });

    sessionConf.store = new RedisStore({
      client: redisClient,
      secret: config.SESSIONS_SECRET,
      prefix: `${config.REDIS_PREFIX}:`,
      ttl: parseInt(config.SESSIONS_TTL, 10),
    });
  } else {
    logger.info('Using default session store');
  }

  app.use(
    expressSession(sessionConf),
  );
};
