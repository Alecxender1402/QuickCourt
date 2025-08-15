import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse } from "@/lib/api";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/lib/types";

// API calls
const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    return response.data.data!;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      userData
    );
    return response.data.data!;
  },

  verifyOTP: async (data: {
    email: string;
    otp: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/verify-otp",
      { email: data.email, otpCode: data.otp }
    );
    return response.data.data!;
  },

  resendOTP: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      "/auth/resend-otp",
      { email }
    );
    return response.data.data!;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      { email }
    );
    return response.data.data!;
  },

  resetPassword: async (data: {
    token: string;
    password: string;
  }): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      data
    );
    return response.data.data!;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data!;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(
      "/auth/profile",
      userData
    );
    return response.data.data!;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<ApiResponse<{ message: string }>>(
      "/auth/change-password",
      data
    );
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};

// React Query hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update query cache
      queryClient.setQueryData(["auth", "currentUser"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useVerifyOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: (data) => {
      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update query cache
      queryClient.setQueryData(["auth", "currentUser"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: authApi.resendOTP,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      // Update stored user data
      localStorage.setItem("user", JSON.stringify(data));

      // Update query cache
      queryClient.setQueryData(["auth", "currentUser"], data);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: authApi.changePassword,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear all queries
      queryClient.clear();
    },
    onError: (error) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      queryClient.clear();

      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Utility functions
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};

export const getCurrentUserFromStorage = (): User | null => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data from storage:", error);
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};
