import axios from "axios";

// API configuration
const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 API Request with token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPreview: token.substring(0, 20) + '...'
      });
    } else {
      console.warn('⚠️ API Request without token:', {
        url: config.url,
        method: config.method,
        hasToken: false
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      console.warn('🔒 Authentication failed - clearing tokens');
      
      // Check if this is a logout request
      const isLogoutRequest = error.config?.url?.includes('/auth/logout');
      
      // Clear auth data and trigger logout
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Dispatch a custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Only redirect if not logout request and not already on login page
      if (!isLogoutRequest && window.location.pathname !== '/') {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
}

// Generic API error type
export interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Helper function to handle API errors
export const handleApiError = (error: unknown): ApiError => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response: {
        data?: {
          message?: string;
          errors?: Array<{ field: string; message: string }>;
        };
        status: number;
      };
    };
    return {
      message: axiosError.response.data?.message || "An error occurred",
      status: axiosError.response.status,
      errors: axiosError.response.data?.errors,
    };
  } else if (error && typeof error === "object" && "request" in error) {
    return {
      message: "Network error - please check your connection",
    };
  } else {
    return {
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

export default api;
