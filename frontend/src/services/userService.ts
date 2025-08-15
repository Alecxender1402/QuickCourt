import { api, ApiResponse } from "@/lib/api";
import { User } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// User profile API calls
const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>(
      "/auth/profile"
    );
    return response.data.data!.user;
  },

  updateProfile: async (profileData: {
    name: string;
    avatar?: string;
    phone?: string;
  }): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      "/auth/profile",
      profileData
    );
    return response.data.data!.user;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.put<ApiResponse>("/auth/change-password", passwordData);
  },

  getUserStats: async (): Promise<{
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  }> => {
    const response = await api.get<
      ApiResponse<{
        totalBookings: number;
        upcomingBookings: number;
        completedBookings: number;
        cancelledBookings: number;
      }>
    >("/user/stats");
    return response.data.data!;
  },
};

// React Query hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => {
      // Update the user profile cache
      queryClient.setQueryData(["user", "profile"], updatedUser);

      // Update user in localStorage if it exists
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...userData,
            ...updatedUser,
          })
        );
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: userApi.changePassword,
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.getUserStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
