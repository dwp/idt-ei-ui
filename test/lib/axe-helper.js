const { configureAxe } = require('jest-axe');

const axe = configureAxe({
  impactLevels: ['minor', 'moderate', 'serious', 'critical'],
});

module.exports = axe;
