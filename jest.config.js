// in jest.config.js
module.exports = {
  testTimeout: 30000,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
  ],
  setupFiles: [
    './test/utils/setup.js',
  ],
  testEnvironment: 'node',
};
