import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse, PaginatedResponse } from "@/lib/api";
import {
  Notification,
  NotificationPreferences,
  NotificationSearchParams,
} from "@/lib/types";

// API calls
const notificationApi = {
  getNotifications: async (
    params: NotificationSearchParams = {}
  ): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<
      ApiResponse<PaginatedResponse<Notification>>
    >("/notifications", { params });
    return response.data.data!;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/mark-all-read");
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>(
      "/notifications/unread-count"
    );
    return response.data.data!.count;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<ApiResponse<NotificationPreferences>>(
      "/notifications/preferences"
    );
    return response.data.data!;
  },

  updatePreferences: async (
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> => {
    const response = await api.put<ApiResponse<NotificationPreferences>>(
      "/notifications/preferences",
      preferences
    );
    return response.data.data!;
  },
};

// React Query hooks
export const useNotifications = (params: NotificationSearchParams = {}) => {
  return useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUnreadNotificationCount = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: notificationApi.getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: options?.enabled !== false, // Default to enabled unless explicitly disabled
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: notificationApi.getPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: () => {
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: () => {
      // Update the preferences cache
      queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
