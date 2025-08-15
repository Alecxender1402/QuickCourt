import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse, PaginatedResponse } from "@/lib/api";
import {
  Booking,
  CreateBookingRequest,
  BookingSearchParams,
} from "@/lib/types";

// Extended booking interface for venue management
export interface VenueManagementBooking extends Booking {
  court_name?: string;
  sport_type?: string;
  venue_name?: string;
  user_name?: string;
  user_email?: string;
  user_id?: number;
}

interface VenueBookingFilters {
  status?: string;
  venueId?: number;
  courtId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// API calls
const bookingApi = {
  getBookings: async (
    params: BookingSearchParams = {}
  ): Promise<PaginatedResponse<Booking>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Booking>>>(
      "/bookings",
      { params }
    );
    return response.data.data!;
  },

  getBookingById: async (bookingId: number): Promise<Booking> => {
    const response = await api.get<ApiResponse<Booking>>(
      `/bookings/${bookingId}`
    );
    return response.data.data!;
  },

  createBooking: async (
    bookingData: CreateBookingRequest
  ): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>(
      "/bookings",
      bookingData
    );
    return response.data.data!;
  },

  cancelBooking: async (
    bookingId: number,
    reason?: string
  ): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(
      `/bookings/${bookingId}/cancel`,
      { reason }
    );
    return response.data.data!;
  },

  rescheduleBooking: async (
    bookingId: number,
    data: {
      newDate: string;
      newStartTime: string;
      newEndTime: string;
    }
  ): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(
      `/bookings/${bookingId}/reschedule`,
      data
    );
    return response.data.data!;
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Booking>>>(
      "/bookings",
      {
        params: { upcoming: true, status: "confirmed" },
      }
    );
    return response.data.data?.items || [];
  },

  getBookingHistory: async (limit: number = 20): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Booking>>>(
      "/bookings",
      {
        params: { status: "completed", limit },
      }
    );
    return response.data.data?.items || [];
  },

  // Venue Management API calls
  getVenueBookings: async (
    filters: VenueBookingFilters = {}
  ): Promise<VenueManagementBooking[]> => {
    const response = await api.get<ApiResponse<VenueManagementBooking[]>>(
      "/venue-management/bookings",
      { params: filters }
    );
    return response.data.data!;
  },

  updateBookingStatus: async (
    bookingId: number,
    data: { status: "confirmed" | "cancelled"; reason?: string }
  ): Promise<VenueManagementBooking> => {
    const response = await api.patch<ApiResponse<VenueManagementBooking>>(
      `/venue-management/bookings/${bookingId}/status`,
      data
    );
    return response.data.data!;
  },

  getVenueBookingDetails: async (
    bookingId: number
  ): Promise<VenueManagementBooking> => {
    const response = await api.get<ApiResponse<VenueManagementBooking>>(
      `/venue-management/bookings/${bookingId}`
    );
    return response.data.data!;
  },
};

// React Query hooks for user bookings
export const useUserBookings = (params: BookingSearchParams = {}) => {
  return useQuery({
    queryKey: ["bookings", "list", params],
    queryFn: () => bookingApi.getBookings(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useBookingDetails = (bookingId: number) => {
  return useQuery({
    queryKey: ["bookings", "details", bookingId],
    queryFn: () => bookingApi.getBookingById(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingBookings = () => {
  return useQuery({
    queryKey: ["bookings", "upcoming"],
    queryFn: bookingApi.getUpcomingBookings,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBookingHistory = (limit: number = 20) => {
  return useQuery({
    queryKey: ["bookings", "history", limit],
    queryFn: () => bookingApi.getBookingHistory(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.createBooking,
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["venues", "details"] }); // For availability updates
      queryClient.invalidateQueries({ queryKey: ["venues", "timeSlots"] }); // For time slot availability
      queryClient.invalidateQueries({
        queryKey: ["public", "availableTimeSlots"],
      }); // For available time slots
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "timeSlots"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: number;
      reason?: string;
    }) => bookingApi.cancelBooking(bookingId, reason),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "details", variables.bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ["venues", "details"] }); // For availability updates
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "timeSlots"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: number;
      data: { newDate: string; newStartTime: string; newEndTime: string };
    }) => bookingApi.rescheduleBooking(bookingId, data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "details", variables.bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ["venues", "details"] }); // For availability updates
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "timeSlots"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Venue Management Hooks
export const useVenueBookings = (filters: VenueBookingFilters = {}) => {
  return useQuery({
    queryKey: ["venueManagement", "bookings", filters],
    queryFn: () => bookingApi.getVenueBookings(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Alias for easier use in BookingOverview - override the existing useBookings for venue management
export const useBookings = useVenueBookings;

export const useVenueBookingDetails = (bookingId: number) => {
  return useQuery({
    queryKey: ["venueManagement", "bookings", "details", bookingId],
    queryFn: () => bookingApi.getVenueBookingDetails(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
      reason,
    }: {
      bookingId: number;
      status: "confirmed" | "cancelled";
      reason?: string;
    }) => bookingApi.updateBookingStatus(bookingId, { status, reason }),
    onSuccess: (updatedBooking) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "bookings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });

      // Update specific booking in cache if it exists
      queryClient.setQueryData(
        ["venueManagement", "bookings", "details", updatedBooking.id],
        updatedBooking
      );
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Additional venue management hooks
export const usePendingVenueBookings = (venueId?: number) => {
  return useVenueBookings({ status: "pending", venueId });
};

export const useConfirmedVenueBookings = (venueId?: number) => {
  return useVenueBookings({ status: "confirmed", venueId });
};

export const useUpcomingVenueBookings = (venueId?: number) => {
  const today = new Date().toISOString().split("T")[0];
  return useVenueBookings({
    venueId,
    startDate: today,
    status: "confirmed",
  });
};

export const useTodayVenueBookings = (venueId?: number) => {
  const today = new Date().toISOString().split("T")[0];
  return useVenueBookings({
    venueId,
    date: today,
    status: "confirmed",
  });
};
