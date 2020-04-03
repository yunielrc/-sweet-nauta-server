module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    'jest-extended'
  ],
  collectCoverage: true,
  testTimeout: 5000,
  verbose: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/nocov/',
    '/etc/'
  ]
};
