const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const healthCheck = require('express-healthcheck');
const createError = require('http-errors');
const redis = require('ioredis');
const nocache = require('nocache');

const viewEngine = require('./middleware/view-engine');
const helmet = require('./middleware/helmet');
const session = require('./middleware/session');
const i18nMiddleware = require('./middleware/i18n');
const cookiesMiddleware = require('./middleware/cookies');

const setAuthState = require('./middleware/set-auth-state');
const errorHandler = require('./middleware/error-handler');
const csurf = require('./middleware/csurf');

const findrRouter = require('./routes/findr/router');
const registrationRouter = require('./routes/registration/router');
const authenticationRouter = require('./routes/authentication/router');
const accountRecoveryRouter = require('./routes/account-recovery/router');

const identityVerificationRouter = require('./routes/identity-verification/router');
const passwordResetRouter = require('./routes/password-reset/router');

const supportPagesRouter = require('./routes/support-pages/router');
const cookiesRouter = require('./routes/cookies/router');

const app = express();

app.set('trust proxy', 1);
viewEngine(app);

app.use(helmet);
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use('/assets', express.static(path.resolve(__dirname, '../node_modules/govuk-frontend/govuk/assets')));
app.use('/js', express.static(path.resolve(__dirname, './public/javascripts')));
app.use('/css', express.static(path.resolve(__dirname, 'public/css')));

app.use(nocache());

session(app, process.env, redis);

app.use(cookieParser());
i18nMiddleware(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set authenticated state
app.use(setAuthState);

app.use(csurf);

app.use('/health', healthCheck());

cookiesMiddleware(app);

// Routers
app.use('/register', registrationRouter);
app.use('/identity-verification', identityVerificationRouter);
app.use('/authenticate', [authenticationRouter, findrRouter]);
app.use('/account-recovery', [accountRecoveryRouter, findrRouter]);
app.use('/password-reset', passwordResetRouter);
app.use('/', supportPagesRouter);
app.use('/cookies', cookiesRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use(errorHandler);

module.exports = app;
