import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "../supabase";

const DEFAULT_DEV_API_URL = "http://localhost:3000/api/v1";
const DEFAULT_PROD_API_URL = "https://barter-dash.vercel.app/api/v1";
const isDevelopment = process.env.NODE_ENV !== "production";

// API Base URL - use localhost during development if env var is missing
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isDevelopment ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL);

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
