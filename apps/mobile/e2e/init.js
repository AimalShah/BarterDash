// Detox 20.x Jest setup
// The test environment handles initialization automatically

jest.setTimeout(300000); // 5 minutes

beforeAll(async () => {
  // Wait for Detox to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
});

beforeEach(async () => {
  // Test setup
});

afterEach(async () => {
  // Test cleanup
});

afterAll(async () => {
  // Global cleanup handled by test environment
});
