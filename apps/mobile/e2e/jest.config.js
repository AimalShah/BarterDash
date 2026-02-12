/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testEnvironment: 'detox/runners/jest/testEnvironment/index.js',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  verbose: true,
  maxWorkers: 1,
  testTimeout: 300000,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { rootMode: 'upward' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(detox)/)',
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['<rootDir>/e2e/setup.js'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
};
