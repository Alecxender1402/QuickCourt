import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse, PaginatedResponse } from "@/lib/api";
import {
  Venue,
  VenueSearchParams,
  CreateVenueRequest,
  Court,
  CreateCourtRequest,
  PopularVenue,
  Sport,
  AvailabilityCheck,
  AvailableTimeSlotsResponse,
  TimeSlot,
  BlockTimeSlotRequest,
} from "@/lib/types";

// Backend API parameter interface
interface BackendVenueParams {
  search?: string;
  city?: string;
  sport?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  amenities?: string;
  venueType?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}

// Backend venues response interface
interface BackendVenuesResponse {
  venues: Venue[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  fallbackMessage?: string; // Message when showing venues from other cities
  searchedCity?: string; // The city that was originally searched
}

// Public API calls
const publicVenueApi = {
  getVenues: async (
    params: VenueSearchParams = {}
  ): Promise<BackendVenuesResponse> => {
    // Transform frontend parameters to match backend API expectations
    const apiParams: BackendVenueParams = {};

    if (params.search) apiParams.search = params.search;
    if (params.location) apiParams.city = params.location; // backend expects 'city'
    if (params.sportType) apiParams.sport = params.sportType; // backend expects 'sport'
    if (params.maxPrice) apiParams.priceMax = params.maxPrice;
    if (params.minRating) apiParams.rating = params.minRating; // backend expects 'rating'
    if (params.venueType) apiParams.venueType = params.venueType;
    if (params.sortBy) apiParams.sortBy = params.sortBy;
    if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
    if (params.limit) apiParams.limit = params.limit;
    if (params.offset) apiParams.offset = params.offset;

    const response = await api.get<ApiResponse<BackendVenuesResponse>>(
      "/public/venues",
      { params: apiParams }
    );
    return response.data.data!;
  },

  getVenueDetails: async (
    venueId: number,
    date?: string
  ): Promise<
    Venue & { courts: Court[]; availability?: AvailabilityCheck[] }
  > => {
    const params = date ? { date } : {};
    const response = await api.get<
      ApiResponse<
        Venue & { courts: Court[]; availability?: AvailabilityCheck[] }
      >
    >(`/public/venues/${venueId}`, { params });
    return response.data.data!;
  },

  getCourtsBySport: async (
    sportType: string,
    params: {
      location?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
    } = {}
  ): Promise<Court[]> => {
    const response = await api.get<ApiResponse<Court[]>>(
      `/public/sports/${sportType}/courts`,
      { params }
    );
    return response.data.data!;
  },

  getPopularVenues: async (
    type: "rating" | "bookings" = "rating",
    limit: number = 10
  ): Promise<PopularVenue[]> => {
    const response = await api.get<ApiResponse<PopularVenue[]>>(
      "/public/venues/popular/list",
      {
        params: { type, limit },
      }
    );
    return response.data.data!;
  },

  getSports: async (): Promise<Sport[]> => {
    const response = await api.get<ApiResponse<Sport[]>>("/public/sports");
    return response.data.data!;
  },

  getSportPricing: async (venueId: number, sportType: string) => {
    const response = await api.get<ApiResponse<any>>(
      `/public/venues/${venueId}/sports/${encodeURIComponent(
        sportType
      )}/pricing`
    );
    return response.data.data!;
  },
};

// Venue Management API calls (for owners)
const venueManagementApi = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse>("/venue-management/dashboard");
    return response.data.data!;
  },

  getMyVenues: async (): Promise<Venue[]> => {
    const response = await api.get<ApiResponse<Venue[]>>(
      "/venue-management/venues"
    );
    return response.data.data!;
  },

  createVenue: async (venueData: CreateVenueRequest): Promise<Venue> => {
    const response = await api.post<ApiResponse<Venue>>(
      "/venue-management/venues",
      venueData
    );
    return response.data.data!;
  },

  createVenueWithImages: async (formData: FormData): Promise<Venue> => {
    const response = await api.post<ApiResponse<Venue>>(
      "/venue-management/venues",
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  updateVenue: async (
    venueId: number,
    venueData: Partial<CreateVenueRequest>
  ): Promise<Venue> => {
    const response = await api.put<ApiResponse<Venue>>(
      `/venue-management/venues/${venueId}`,
      venueData
    );
    return response.data.data!;
  },

  updateVenueWithImages: async (
    venueId: number,
    formData: FormData
  ): Promise<Venue> => {
    const response = await api.put<ApiResponse<Venue>>(
      `/venue-management/venues/${venueId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  deleteVenue: async (venueId: number): Promise<void> => {
    await api.delete(`/venue-management/venues/${venueId}`);
  },

  getCourts: async (venueId: number): Promise<Court[]> => {
    const response = await api.get<ApiResponse<Court[]>>(
      `/venue-management/venues/${venueId}/courts`
    );
    return response.data.data!;
  },

  createCourt: async (
    venueId: number,
    courtData: CreateCourtRequest
  ): Promise<Court> => {
    const response = await api.post<ApiResponse<Court>>(
      `/venue-management/venues/${venueId}/courts`,
      courtData
    );
    return response.data.data!;
  },

  updateCourt: async (
    venueId: number,
    courtId: number,
    courtData: Partial<CreateCourtRequest>
  ): Promise<Court> => {
    const response = await api.put<ApiResponse<Court>>(
      `/venue-management/venues/${venueId}/courts/${courtId}`,
      courtData
    );
    return response.data.data!;
  },

  deleteCourt: async (venueId: number, courtId: number): Promise<void> => {
    await api.delete(`/venue-management/venues/${venueId}/courts/${courtId}`);
  },

  getBlockedSlots: async (
    venueId: number,
    courtId: number,
    dayOfWeek?: number
  ): Promise<TimeSlot[]> => {
    const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
    const response = await api.get<ApiResponse<TimeSlot[]>>(
      `/venue-management/venues/${venueId}/courts/${courtId}/blocked-slots`,
      { params }
    );
    return response.data.data!;
  },

  blockTimeSlots: async (
    venueId: number,
    courtId: number,
    data: { slotIds: number[]; reason?: string }
  ): Promise<void> => {
    await api.post(
      `/venue-management/venues/${venueId}/courts/${courtId}/block-slots`,
      data
    );
  },

  unblockTimeSlots: async (
    venueId: number,
    courtId: number,
    data: { slotIds: number[] }
  ): Promise<void> => {
    await api.post(
      `/venue-management/venues/${venueId}/courts/${courtId}/unblock-slots`,
      data
    );
  },

  getTimeSlots: async (
    venueId: number,
    courtId: number,
    dayOfWeek?: number
  ): Promise<TimeSlot[]> => {
    const params = dayOfWeek !== undefined ? { dayOfWeek } : {};
    const response = await api.get<ApiResponse<TimeSlot[]>>(
      `/venue-management/venues/${venueId}/courts/${courtId}/time-slots`,
      { params }
    );
    return response.data.data!;
  },

  createTimeSlots: async (
    venueId: number,
    courtId: number,
    timeSlots: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable?: boolean;
    }>
  ): Promise<void> => {
    await api.post(
      `/venue-management/venues/${venueId}/courts/${courtId}/time-slots`,
      { timeSlots }
    );
  },

  updateTimeSlot: async (
    venueId: number,
    courtId: number,
    slotId: number,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      isAvailable?: boolean;
    }
  ): Promise<TimeSlot> => {
    const response = await api.put<ApiResponse<TimeSlot>>(
      `/venue-management/venues/${venueId}/courts/${courtId}/time-slots/${slotId}`,
      data
    );
    return response.data.data!;
  },

  deleteTimeSlot: async (
    venueId: number,
    courtId: number,
    slotId: number
  ): Promise<void> => {
    await api.delete(
      `/venue-management/venues/${venueId}/courts/${courtId}/time-slots/${slotId}`
    );
  },

  generateDefaultTimeSlots: async (
    venueId: number,
    courtId: number,
    config: {
      operatingHours?: { start: string; end: string };
      slotDuration?: number;
      daysOfWeek?: number[];
    }
  ): Promise<void> => {
    await api.post(
      `/venue-management/venues/${venueId}/courts/${courtId}/generate-default-slots`,
      config
    );
  },

  getAvailableTimeSlots: async (
    courtId: number,
    date: string
  ): Promise<AvailableTimeSlotsResponse> => {
    const response = await api.get<ApiResponse<AvailableTimeSlotsResponse>>(
      `/public/courts/${courtId}/available-slots?date=${date}`
    );
    return response.data.data!;
  },

  getAllCourtTimeSlots: async (
    courtId: number,
    date: string
  ): Promise<{
    date: string;
    courtId: number;
    court: {
      id: number;
      name: string;
      pricePerHour: number;
      sportType: string;
      venue: { id: number; name: string; isApproved: boolean };
    };
    allSlots: Array<{
      id: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      formattedStartTime: string;
      formattedEndTime: string;
      isAvailable: boolean;
      isBlocked: boolean;
      hasConflict: boolean;
      conflictReason: string | null;
    }>;
    availableSlots: Array<any>;
    unavailableSlots: Array<any>;
  }> => {
    const response = await api.get<ApiResponse<any>>(
      `/public/courts/${courtId}/all-slots?date=${date}`
    );
    return response.data.data!;
  },

  getVenueOwnerReviews: async (params: {
    venueId?: number;
    rating?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{
    reviews: Array<{
      id: number;
      rating: number;
      comment: string;
      createdAt: string;
      helpfulCount: number;
      user: {
        id: number;
        name: string;
        email: string;
      };
      venue: {
        id: number;
        name: string;
        location: string;
      };
      booking?: {
        id: number;
        bookingDate: string;
        startTime: string;
        endTime: string;
      };
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasNext: boolean;
    };
  }> => {
    const response = await api.get<ApiResponse<any>>(
      "/venue-management/reviews",
      { params }
    );
    return response.data.data!;
  },
};

// Public venue hooks
export const useVenues = (params: VenueSearchParams = {}) => {
  return useQuery({
    queryKey: ["venues", "list", params],
    queryFn: () => publicVenueApi.getVenues(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVenueDetails = (venueId: number, date?: string) => {
  return useQuery({
    queryKey: ["venues", "details", venueId, date],
    queryFn: () => publicVenueApi.getVenueDetails(venueId, date),
    enabled: !!venueId,
    staleTime: 0, // Always fetch fresh data for rating updates
    refetchOnWindowFocus: true,
  });
};

export const useCourtsBySport = (
  sportType: string,
  params: {
    location?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ["courts", "bySport", sportType, params],
    queryFn: () => publicVenueApi.getCourtsBySport(sportType, params),
    enabled: !!sportType,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePopularVenues = (
  type: "rating" | "bookings" = "rating",
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["venues", "popular", type, limit],
    queryFn: () => publicVenueApi.getPopularVenues(type, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSports = () => {
  return useQuery({
    queryKey: ["sports"],
    queryFn: publicVenueApi.getSports,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useSportPricing = (venueId: number, sportType: string) => {
  return useQuery({
    queryKey: ["venues", venueId, "sports", sportType, "pricing"],
    queryFn: () => publicVenueApi.getSportPricing(venueId, sportType),
    enabled: !!venueId && !!sportType,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Venue management hooks (for owners)
export const useVenueManagementDashboard = () => {
  return useQuery({
    queryKey: ["venueManagement", "dashboard"],
    queryFn: venueManagementApi.getDashboard,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyVenues = () => {
  return useQuery({
    queryKey: ["venueManagement", "myVenues"],
    queryFn: venueManagementApi.getMyVenues,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: venueManagementApi.createVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "myVenues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useCreateVenueWithImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: venueManagementApi.createVenueWithImages,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "myVenues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      data,
    }: {
      venueId: number;
      data: Partial<CreateVenueRequest>;
    }) => venueManagementApi.updateVenue(venueId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "venues", variables.venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "myVenues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateVenueWithImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      formData,
    }: {
      venueId: number;
      formData: FormData;
    }) => venueManagementApi.updateVenueWithImages(venueId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "venues", variables.venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "myVenues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: venueManagementApi.deleteVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "myVenues"],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "dashboard"],
      });
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useMyCourts = (venueId: number) => {
  return useQuery({
    queryKey: ["venueManagement", "courts", venueId],
    queryFn: () => venueManagementApi.getCourts(venueId),
    enabled: !!venueId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      data,
    }: {
      venueId: number;
      data: CreateCourtRequest;
    }) => venueManagementApi.createCourt(venueId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "courts", variables.venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["venues", "details", variables.venueId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      data,
    }: {
      venueId: number;
      courtId: number;
      data: Partial<CreateCourtRequest>;
    }) => venueManagementApi.updateCourt(venueId, courtId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "courts", variables.venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["venues", "details", variables.venueId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteCourt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ venueId, courtId }: { venueId: number; courtId: number }) =>
      venueManagementApi.deleteCourt(venueId, courtId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "courts", variables.venueId],
      });
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useBlockedSlots = (
  venueId: number,
  courtId: number,
  dayOfWeek?: number
) => {
  return useQuery({
    queryKey: ["venueManagement", "blockedSlots", venueId, courtId, dayOfWeek],
    queryFn: () =>
      venueManagementApi.getBlockedSlots(venueId, courtId, dayOfWeek),
    enabled: !!venueId && !!courtId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useBlockTimeSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      data,
    }: {
      venueId: number;
      courtId: number;
      data: { slotIds: number[]; reason?: string };
    }) => venueManagementApi.blockTimeSlots(venueId, courtId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "blockedSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["venues", "details"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUnblockTimeSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      data,
    }: {
      venueId: number;
      courtId: number;
      data: { slotIds: number[] };
    }) => venueManagementApi.unblockTimeSlots(venueId, courtId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "blockedSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["venues", "details"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

// Additional time slot management hooks
export const useTimeSlots = (
  venueId: number,
  courtId: number,
  dayOfWeek?: number
) => {
  return useQuery({
    queryKey: ["venueManagement", "timeSlots", venueId, courtId, dayOfWeek],
    queryFn: () => venueManagementApi.getTimeSlots(venueId, courtId, dayOfWeek),
    enabled: !!venueId && !!courtId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateTimeSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      timeSlots,
    }: {
      venueId: number;
      courtId: number;
      timeSlots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable?: boolean;
      }>;
    }) => venueManagementApi.createTimeSlots(venueId, courtId, timeSlots),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "timeSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "courts", variables.venueId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      slotId,
      data,
    }: {
      venueId: number;
      courtId: number;
      slotId: number;
      data: {
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        isAvailable?: boolean;
      };
    }) => venueManagementApi.updateTimeSlot(venueId, courtId, slotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "timeSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteTimeSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      slotId,
    }: {
      venueId: number;
      courtId: number;
      slotId: number;
    }) => venueManagementApi.deleteTimeSlot(venueId, courtId, slotId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "timeSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useGenerateDefaultTimeSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      courtId,
      config,
    }: {
      venueId: number;
      courtId: number;
      config: {
        operatingHours?: { start: string; end: string };
        slotDuration?: number;
        daysOfWeek?: number[];
      };
    }) => venueManagementApi.generateDefaultTimeSlots(venueId, courtId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "venueManagement",
          "timeSlots",
          variables.venueId,
          variables.courtId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["venueManagement", "courts", variables.venueId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useAvailableTimeSlots = (courtId: number, date: string) => {
  return useQuery({
    queryKey: ["public", "availableTimeSlots", courtId, date],
    queryFn: () => venueManagementApi.getAvailableTimeSlots(courtId, date),
    enabled: !!courtId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAllCourtTimeSlots = (courtId: number, date: string) => {
  return useQuery({
    queryKey: ["public", "allCourtTimeSlots", courtId, date],
    queryFn: () => venueManagementApi.getAllCourtTimeSlots(courtId, date),
    enabled: !!courtId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useVenueOwnerReviews = (params: {
  venueId?: number;
  rating?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
} = {}) => {
  return useQuery({
    queryKey: ["venueManagement", "reviews", params],
    queryFn: () => venueManagementApi.getVenueOwnerReviews(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};
