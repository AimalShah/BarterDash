const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
let withStorybook = (config) => config;

try {
  ({ withStorybook } = require("@storybook/react-native/metro/withStorybook"));
} catch (error) {
  // Storybook packages may not be installed in every environment.
}

const config = getDefaultConfig(__dirname);

// Add react-native-vector-icons asset extensions
const { assetExts, serializer, resolver } = config;

// Add additional node_modules paths for module resolution
const nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "..", "node_modules"),
];

// Force resolution of expo-constants to root version
const extraNodeModules = {
  "expo-constants": path.resolve(__dirname, "..", "node_modules", "expo-constants"),
  "debug": path.resolve(__dirname, "node_modules", "debug"),
  "buffer": path.resolve(__dirname, "node_modules", "buffer"),
};

const nativewindConfig = withNativeWind(
  {
    ...config,
    resolver: {
      ...resolver,
      nodeModulesPaths,
      extraNodeModules,
      assetExts: Array.isArray(assetExts) ? [...assetExts, "ttf", "otf", "png", "jpg", "jpeg", "gif"] : ["ttf", "otf", "png", "jpg", "jpeg", "gif"],
    },
    serializer: {
      ...serializer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  },
  { input: "./global.css" }
);

module.exports = withStorybook(nativewindConfig, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true",
  configPath: path.resolve(__dirname, ".storybook"),
});
