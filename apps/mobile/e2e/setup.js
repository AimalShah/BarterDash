// Minimal E2E setup - don't use React Native's jest/setup.js which has Flow types
// This sets up only what's needed for Detox E2E tests

global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// Mock timers
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
}

// Mock performance
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Mock nativeFabricUIManager
if (typeof global.nativeFabricUIManager === 'undefined') {
  global.nativeFabricUIManager = {};
}

// Mock __DEV__
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}
