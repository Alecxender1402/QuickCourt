import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse, PaginatedResponse } from "@/lib/api";
import { Review, CreateReviewRequest, ReviewSearchParams } from "@/lib/types";

// API calls
const reviewApi = {
  getVenueReviews: async (
    venueId: number,
    params: ReviewSearchParams = {}
  ): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Review>>>(
      `/reviews/venues/${venueId}`,
      { params }
    );
    return response.data.data!;
  },

  createReview: async (reviewData: CreateReviewRequest): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>(
      "/reviews",
      reviewData
    );
    return response.data.data!;
  },

  updateReview: async (
    reviewId: number,
    reviewData: Partial<CreateReviewRequest>
  ): Promise<Review> => {
    const response = await api.put<ApiResponse<Review>>(
      `/reviews/${reviewId}`,
      reviewData
    );
    return response.data.data!;
  },

  deleteReview: async (reviewId: number): Promise<void> => {
    await api.delete(`/reviews/${reviewId}`);
  },

  getMyReviews: async (): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>(
      "/reviews/my-reviews"
    );
    return response.data.data!;
  },

  markReviewHelpful: async (reviewId: number): Promise<void> => {
    await api.post(`/reviews/${reviewId}/helpful`);
  },

  getReviewById: async (reviewId: number): Promise<Review> => {
    const response = await api.get<ApiResponse<Review>>(`/reviews/${reviewId}`);
    return response.data.data!;
  },
};

// React Query hooks
export const useVenueReviews = (
  venueId: number,
  params: ReviewSearchParams = {}
) => {
  return useQuery({
    queryKey: ["reviews", "venue", venueId, params],
    queryFn: () => reviewApi.getVenueReviews(venueId, params),
    enabled: !!venueId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

export const useMyReviews = () => {
  return useQuery({
    queryKey: ["reviews", "my-reviews"],
    queryFn: reviewApi.getMyReviews,
    staleTime: 5 * 60 * 1000,
  });
};

export const useReviewDetails = (reviewId: number) => {
  return useQuery({
    queryKey: ["reviews", "details", reviewId],
    queryFn: () => reviewApi.getReviewById(reviewId),
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewApi.createReview,
    onSuccess: (_, variables) => {
      // Invalidate relevant queries with correct query keys
      queryClient.invalidateQueries({
        queryKey: ["reviews", "venue", variables.venueId],
        exact: false, // This will invalidate all queries that start with this key
      });
      queryClient.invalidateQueries({ 
        queryKey: ["reviews", "my-reviews"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["venues", "details", variables.venueId],
        exact: false,
      });
      queryClient.invalidateQueries({ 
        queryKey: ["venues", "list"],
        exact: false,
      }); // For rating updates in lists
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: Partial<CreateReviewRequest>;
    }) => reviewApi.updateReview(reviewId, data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["reviews", "venue", data.venueId],
      });
      queryClient.invalidateQueries({ queryKey: ["reviews", "my-reviews"] });
      queryClient.invalidateQueries({
        queryKey: ["reviews", "details", variables.reviewId],
      });
      queryClient.invalidateQueries({
        queryKey: ["venues", "details", data.venueId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewApi.deleteReview,
    onSuccess: () => {
      // Invalidate all review-related queries
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["venues"] }); // For rating updates
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewApi.markReviewHelpful,
    onSuccess: () => {
      // Invalidate review queries to update helpful count
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
