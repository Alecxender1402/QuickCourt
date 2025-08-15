import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse } from "@/lib/api";
import { SubmitVenueReportRequest } from "@/lib/types";

// API calls
const reportApi = {
  submitVenueReport: async (
    venueId: number,
    data: SubmitVenueReportRequest
  ): Promise<void> => {
    await api.post(`/public/venues/${venueId}/report`, data);
  },
};

// React Query hooks
export const useSubmitVenueReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      data,
    }: {
      venueId: number;
      data: SubmitVenueReportRequest;
    }) => reportApi.submitVenueReport(venueId, data),
    onSuccess: (_, variables) => {
      // Invalidate venue-related queries
      queryClient.invalidateQueries({
        queryKey: ["venues", "details", variables.venueId],
      });
      // Invalidate admin report queries if user is admin
      queryClient.invalidateQueries({ queryKey: ["admin", "venueReports"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reportStats"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
