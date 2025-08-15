import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError, ApiResponse } from "@/lib/api";
import {
  Payment,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  RefundRequest,
} from "@/lib/types";

// API calls
const paymentApi = {
  createPaymentIntent: async (
    data: CreatePaymentIntentRequest
  ): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    const response = await api.post<
      ApiResponse<{ clientSecret: string; paymentIntentId: string }>
    >("/payments/create-intent", data);
    return response.data.data!;
  },

  confirmPayment: async (data: ConfirmPaymentRequest): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>(
      "/payments/confirm",
      data
    );
    return response.data.data!;
  },

  getPaymentHistory: async (limit: number = 20): Promise<Payment[]> => {
    const response = await api.get<ApiResponse<Payment[]>>(
      "/payments/history",
      { params: { limit } }
    );
    return response.data.data!;
  },

  getPaymentById: async (paymentId: number): Promise<Payment> => {
    const response = await api.get<ApiResponse<Payment>>(
      `/payments/${paymentId}`
    );
    return response.data.data!;
  },

  processRefund: async (
    bookingId: number,
    data: RefundRequest
  ): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>(
      `/payments/refund/${bookingId}`,
      data
    );
    return response.data.data!;
  },

  getPaymentsByBooking: async (bookingId: number): Promise<Payment[]> => {
    const response = await api.get<ApiResponse<Payment[]>>(
      `/payments/booking/${bookingId}`
    );
    return response.data.data!;
  },
};

// React Query hooks
export const usePaymentHistory = (limit: number = 20) => {
  return useQuery({
    queryKey: ["payments", "history", limit],
    queryFn: () => paymentApi.getPaymentHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePaymentDetails = (paymentId: number) => {
  return useQuery({
    queryKey: ["payments", "details", paymentId],
    queryFn: () => paymentApi.getPaymentById(paymentId),
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentsByBooking = (bookingId: number) => {
  return useQuery({
    queryKey: ["payments", "booking", bookingId],
    queryFn: () => paymentApi.getPaymentsByBooking(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: paymentApi.createPaymentIntent,
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentApi.confirmPayment,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] }); // For booking status updates
      if (data.bookingId) {
        queryClient.invalidateQueries({
          queryKey: ["bookings", "details", data.bookingId],
        });
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: number;
      data: RefundRequest;
    }) => paymentApi.processRefund(bookingId, data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({
        queryKey: ["bookings", "details", variables.bookingId],
      });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      throw apiError;
    },
  });
};
