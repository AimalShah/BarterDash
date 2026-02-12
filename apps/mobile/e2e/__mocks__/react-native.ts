// Minimal React Native mock for E2E tests
// This avoids the Flow type syntax issue in the actual react-native/jest/setup.js

const React = require('react');

// Mock NativeModules
const NativeModules = {
  UIManager: {
    measure: jest.fn(),
    measureInWindow: jest.fn(),
    measureLayout: jest.fn(),
    measureLayoutRelativeToParent: jest.fn(),
  },
  PlatformConstants: {
    get: jest.fn(() => 'android'),
  },
  DeviceEventEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};

// Mock Platform
const Platform = {
  OS: 'android',
  Version: 30,
  select: jest.fn((obj) => obj.android || obj.default),
};

// Mock StyleSheet
const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
};

// Mock View, Text, Image, etc.
const View = React.forwardRef((props, ref) => null);
const Text = React.forwardRef((props, ref) => null);
const Image = React.forwardRef((props, ref) => null);
const ScrollView = React.forwardRef((props, ref) => null);
const TextInput = React.forwardRef((props, ref) => null);
const TouchableOpacity = React.forwardRef((props, ref) => null);
const TouchableHighlight = React.forwardRef((props, ref) => null);
const TouchableWithoutFeedback = React.forwardRef((props, ref) => null);
const Pressable = React.forwardRef((props, ref) => null);
const FlatList = React.forwardRef((props, ref) => null);
const SectionList = React.forwardRef((props, ref) => null);
const SafeAreaView = React.forwardRef((props, ref) => null);

// Mock Dimensions
const Dimensions = {
  get: jest.fn(() => ({ width: 411, height: 823, scale: 2.75, fontScale: 1 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  set: jest.fn(),
};

// Mock AsyncStorage
const AsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
};

// Mock Appearance
const Appearance = {
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
};

// Mock AppState
const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock Keyboard
const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

module.exports = {
  // Core components
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
  FlatList,
  SectionList,
  SafeAreaView,
  
  // APIs
  Platform,
  StyleSheet,
  Dimensions,
  AsyncStorage,
  Appearance,
  AppState,
  Keyboard,
  
  // Native modules
  NativeModules,
  
  // Utilities
  PixelRatio: {
    get: jest.fn(() => 2.75),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((size) => size * 2.75),
    roundToNearestPixel: jest.fn((size) => Math.round(size)),
  },
  
  // Hooks
  useColorScheme: jest.fn(() => 'light'),
  useWindowDimensions: jest.fn(() => ({ width: 411, height: 823, scale: 2.75, fontScale: 1 })),
  
  // Other
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openSettings: jest.fn(() => Promise.resolve()),
  },
  DeviceEventEmitter: NativeModules.DeviceEventEmitter,
};
