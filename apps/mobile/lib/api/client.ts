import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "../supabase";

// API Base URL - Use environment variable with fallback for development
// For Android emulator: use 10.0.2.2 to reach host machine
// For iOS simulator: use localhost
// For physical device: use your computer's local IP (e.g., http://192.168.1.xxx:3000/api/v1)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api/v1";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to every request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get current session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      return config;
    } catch (error) {
      console.error("Error in request interceptor:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !session) {
          // Refresh failed, redirect to login
          await supabase.auth.signOut();
          return Promise.reject(error);
        }

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        await supabase.auth.signOut();
        return Promise.reject(error);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  },
);

export default apiClient;
