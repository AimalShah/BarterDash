// API Configuration
// Platform-specific URLs to handle CORS and network issues

import { Platform } from "react-native";

const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    // Option 1: Use proxy (configured in app.json) - avoids CORS
    // Proxy routes /api/* to http://localhost:3000/api/*
    return "http://localhost:3000/api/v1";

    // Option 2: Direct URL (requires backend CORS configuration)
    // Uncomment if backend has CORS configured:
    // return 'http://localhost:3000/api/v1';
  } else {
    // Mobile: Use local IP for physical devices
    // For emulator, you can use localhost:3000/api/v1
    return "http://localhost:3000/api/v1";
  }
};

export const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
  console.log("[API DEBUG] API Base URL:", {
    platform: Platform.OS,
    url: API_BASE_URL,
    note:
      Platform.OS === "web"
        ? "Using proxy - requests go through Expo dev server"
        : "Using direct IP - ensure device can reach this IP",
  });
}
