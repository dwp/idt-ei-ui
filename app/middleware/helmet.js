const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      connectSrc: [
        'https://www.google-analytics.com/j/collect',
      ],
      defaultSrc: [
        "'self'",
      ],
      scriptSrc: [
        "'self'",
        // head - prevent backward/forward cache
        "'sha256-JOshfvb3Xzg+Ko4hDzlvATXH07IndLt+ec7ycjZXCMs='",
        // govuk js enabled
        "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
        // bodyEnd
        "'sha256-39Hrp0iQOKYhrKllHNlxLVXAr1KPRS25KOuR8r4tuFQ='",
        // flag to indicate to serverside that js is enabled
        "'sha256-fjv7tzoazn9X+yjphxCSHYT2iNimI68ET03/CDkaHT0='",
        // polyfill for dialog, for session timeout warning
        'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.5.0/dialog-polyfill.js',
        // google analytics snippet
        "'sha256-13hNuFw5JA3hk2g6jBs3M+zF5jmUYkUL/Xix6OWB7tc='",
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [
        "'self'",
        // language toggle
        "'sha256-fU9M4xymXhufbOigyWWWqtv5AMjVOXDwCllBT59LOwU='",
      ],
    },
  },
});
