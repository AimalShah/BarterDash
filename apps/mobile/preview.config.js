module.exports = {
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "expo-constants": require.resolve("expo-constants"),
    },
  },
  bundler: {
    esbuild: {
      loader: {
        ".js": "jsx",
      },
    },
  },
};
