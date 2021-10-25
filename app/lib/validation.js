const { check } = require('express-validator');
const moment = require('moment');

const validationSummary = (req, errors) => errors.array().map((error) => ({
  text: req.t(error.msg, { keySeparator: '>', nsSeparator: '>' }),
  href: `#${error.param}`,
}));

const validationErrors = (req, errors) => ({
  errorsMapped: errors.mapped(),
  errors: errors.errors,
  errorSummary: validationSummary(req, errors),
  form: req.body,
});

const createError = (req, msgId) => ({ param: 'callbacks[0]', msg: req.t(msgId) });

// TODO: Create a custom error summary builder to avoid hardcoding
const accountExistsError = (req, error) => ({
  form: {
    callbacks: req.body.callbacks,
  },
  errorsMapped: {
    'callbacks[0]': {
      value: '',
      msg: req.t('auth-sign-in:invalid.incorrect'),
      param: 'callbacks[0]',
      location: 'body',
    },
    'callbacks[1]': {
      value: '',
      msg: req.t('auth-sign-in:invalid.incorrect'),
      param: 'callbacks[1]',
      location: 'body',
    },
  },
  errorSummary: [
    {
      text: req.t('auth-sign-in:invalid.incorrect'),
      href: '#callbacks[0]',
    },
    {
      text: error.msg,
      href: `#${error.param}`,
    },
  ],
});

const emailValidationRules = [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.email.empty', { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .trim()
    .customSanitizer((value) => value.toLowerCase().replace(/\s+/g, ''))
    .isEmail()
    .withMessage((value, { req, location, path }) => req.t('common:errors.email.invalid', { value, location, path }))
    .custom((value, { req }) => {
      const error = new Error(req.t('common:errors.email.invalid'));
      if (value.substring(0, 1) === '-') {
        throw error;
      }
      return true;
    }),
];

const passwordValidationRules = [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.password.empty', { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .isLength({ min: 8 })
    .withMessage((value, { req, location, path }) => req.t('common:errors.password.length', { value, location, path }))
    // eslint-disable-next-line no-useless-escape
    .matches(/^[A-Za-z\d@$.!%*#?&^_\-;+=\[\]{}|:',./`~"()]+$/)
    .withMessage((value, { req, location, path }) => req.t('common:errors.password.invalid', { value, location, path }))
    .matches(
      // eslint-disable-next-line no-useless-escape
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$.!%*#?&^_\-;+=\[\]{}|:',.//`~"()-]).*$/,
    )
    .withMessage((value, { req, location, path }) => req.t('common:errors.password.conditions', { value, location, path })),
  check('callbacks[1]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.password.empty-confirm', {
      value,
      location,
      path,
    }))
    .custom((value, { req }) => {
      const error = new Error(req.t('common:errors.password.unmatched'));
      if (
        (Array.isArray(req.body.callbacks)
          && value !== req.body.callbacks[0])
        || (req.body['callbacks[0]'] && value !== req.body['callbacks[0]'])
      ) {
        throw error;
      }
      return true;
    }),
];

const commonVerifySecurityCodeRules = [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.security-code.empty', { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .trim()
    .customSanitizer((value) => value.replace(/\s+/g, ''))
    .custom((value, { req }) => {
      if (value.length === 0) {
        throw new Error(req.t('common:errors.security-code.empty'));
      }
      if (value.length !== 6 || !value.match(/^[0-9]+$/)) {
        throw new Error(req.t('common:errors.security-code.incorrect-security-code'));
      }
      return true;
    }),
];

const mobileValidationRules = (emptyErr, invalidErr) => [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t(emptyErr, { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .matches(/^\+?[0-9\s]*$/)
    .withMessage((value, { req, location, path }) => req.t(invalidErr, { value, location, path })),
];

const nameValidationRules = [
  check('callbacks[0]')
    .trim()
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.name.first-name-empty', { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .matches(/^[\u00C0-\u017F a-zA-Z'-]+$/)
    .withMessage((value, { req, location, path }) => req.t('common:errors.name.first-name-invalid', { value, location, path })),
  check('callbacks[1]')
    .trim()
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.name.last-name-empty', { value, location, path }))
    .if(check('callbacks[1]').notEmpty())
    .matches(/^[\u00C0-\u017F a-zA-Z'-]+$/)
    .withMessage((value, { req, location, path }) => req.t('common:errors.name.last-name-invalid', { value, location, path })),
];

const checkForNonNumericCharacters = (req) => {
  // If any date field contains non-numeric characters
  // place red border around that field, and display 'Date must be a real date' esrro
  if (!req.body.year.replace(/\s+/g, '').match(/^\d+$/)) {
    req.dateErrors.invalidYear = true;
  }
  if (!req.body.month.replace(/\s+/g, '').match(/^\d+$/)) {
    req.dateErrors.invalidMonth = true;
  }
  if (!req.body.day.replace(/\s+/g, '').match(/^\d+$/)) {
    req.dateErrors.invalidDay = true;
  }
  if (req.dateErrors.invalidYear || req.dateErrors.invalidMonth || req.dateErrors.invalidDay) {
    throw new Error(req.t('common:errors.date-of-birth.invalid'));
  }
};

const dateOfBirthValidationRules = [
  (req, res, next) => {
    const { day, month, year } = req.body;
    // set callbacks array as this is required for return call to ForgeRock
    req.body.callbacks = [day.replace(/\s+/g, ''), month.replace(/\s+/g, ''), year.replace(/\s+/g, '')];
    req.body.date = `${day.replace(/\s+/g, '')}/${month.replace(/\s+/g, '')}/${year.replace(/\s+/g, '')}`;
    next();
  },
  check('date')
    .trim()
    .customSanitizer((value) => value.replace(/\s+/g, ''))
    .custom((value, { req }) => {
      req.body.day = req.body.day.replace(/\s+/g, '');
      req.body.month = req.body.month.replace(/\s+/g, '');
      req.body.year = req.body.year.replace(/\s+/g, '');

      req.dateErrors = {};
      // req.dateErrors will determine which date field (day, month, year) has red border around it
      // e.g. req.dateErrors.invalidYear = true - will mean red error border around year field

      // if any field or all fields are empty, display 'Enter your date of birth' error
      // no red borders required
      if (req.body.year === '' || req.body.month === '' || req.body.day === '') {
        throw new Error(req.t('common:errors.date-of-birth.empty'));
      }

      checkForNonNumericCharacters(req);
      // If year field is not 4 digits, place red border on year field
      // and display 'Year must be 4 digits' error
      if (req.body.year.length !== 4) {
        req.dateErrors.invalidYear = true;
        throw new Error(req.t('common:errors.date-of-birth.year'));
      }
      const year = parseInt(req.body.year, 10);
      const month = parseInt(req.body.month, 10);
      const day = parseInt(req.body.day, 10);

      // If year is more than 130 years in past, place red border on year field
      // and display 'Check the year you were born' error
      const now = moment().startOf('day');
      if (now.year() - year > 130) {
        req.dateErrors.invalidYear = true;
        throw new Error(req.t('common:errors.date-of-birth.past'));
      }
      // For (e.g.) 33/13/2000, red border around both day and month
      // and display 'Date must be real date' error
      // for (e.g.) 31/13/2000, red border around month only
      // and display 'Date must be real date' error
      if (day < 1 || day > 31) {
        req.dateErrors.invalidDay = true;
      }
      if (month < 1 || month > 12) {
        req.dateErrors.invalidMonth = true;
        throw new Error(req.t('common:errors.date-of-birth.invalid'));
      }
      // Final check on whether date valid
      // e.g. this will capture 29/2/2001 and 31/9/2001 as invalid
      // At this point it can only be caused by a day error, so red border on day only
      const parsedDate = moment(value, 'D/M/YYYY', true);
      if (!parsedDate.isValid()) {
        req.dateErrors.invalidDay = true;
        throw new Error(req.t('common:errors.date-of-birth.invalid'));
      }
      // 'date must be in the past' error - red border around all fields
      if (parsedDate.isAfter(now) || parsedDate.isSame(now)) {
        req.dateErrors = {
          invalidYear: true, invalidMonth: true, invalidDay: true,
        };
        throw new Error(req.t('common:errors.date-of-birth.future'));
      }
      return true;
    }),
];

const postcodeValidationRules = [
  (req, res, next) => {
    // sanitise postcode
    let postcode = req.body.callbacks[0]
      .trim().replace(/ /g, '')
      .toUpperCase();
    postcode = `${postcode.slice(0, postcode.length - 3)} ${postcode.slice(postcode.length - 3)}`;
    req.body.callbacks[0] = postcode;
    next();
  },
  check('callbacks[0]')
    .trim()
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.postcode.empty', { value, location, path }))
    .if(check('callbacks[0]').notEmpty())
    .matches(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/)
    .withMessage((value, { req, location, path }) => req.t('common:errors.postcode.invalid', { value, location, path })),
];

const changePasswordValidation = [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('common:errors.changePassword.empty', { value, location, path })),
];

const accountRecoveryAccessValidation = [
  check('callbacks[0]')
    .notEmpty()
    .withMessage((value, { req, location, path }) => req.t('account-recovery:errors.empty', { value, location, path })),
];

module.exports = {
  validationErrors,
  accountExistsError,
  createError,
  emailValidationRules,
  passwordValidationRules,
  commonVerifySecurityCodeRules,
  mobileValidationRules,
  nameValidationRules,
  dateOfBirthValidationRules,
  postcodeValidationRules,
  changePasswordValidation,
  accountRecoveryAccessValidation,
};
