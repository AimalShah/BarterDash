module.exports = {
  preset: 'react-native',
  testRunner: 'jest-circus/runner',
  testEnvironment: 'detox/runners/jest/DetoxCircusEnvironment',
  setupFilesAfterEnv: ['./init.js'],
  testMatch: ['**/*.e2e.ts'],
  verbose: true,
};
