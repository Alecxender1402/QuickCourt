import {
  api,
  ApiResponse,
  PaginatedResponse,
  handleApiError,
} from "../lib/api";
import { Court, CreateCourtRequest } from "../lib/types";

export interface CourtSearchParams {
  venueId?: number;
  sportType?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "sportType" | "pricePerHour" | "createdAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface UpdateCourtRequest extends Partial<CreateCourtRequest> {
  isActive?: boolean;
}

class CourtService {
  private baseUrl = "/venue-management/courts";

  // Get all courts for a specific venue (for venue owners)
  async getCourts(
    params: CourtSearchParams = {}
  ): Promise<PaginatedResponse<Court>> {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Court>>>(
        this.baseUrl,
        {
          params,
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch courts");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get courts for a specific venue (public view)
  async getCourtsByVenue(venueId: number): Promise<Court[]> {
    try {
      const response = await api.get<ApiResponse<Court[]>>(
        `/public/venues/${venueId}/courts`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch venue courts");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get a specific court by ID
  async getCourtById(courtId: number): Promise<Court> {
    try {
      const response = await api.get<ApiResponse<Court>>(
        `${this.baseUrl}/${courtId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch court");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create a new court
  async createCourt(courtData: CreateCourtRequest): Promise<Court> {
    try {
      const response = await api.post<ApiResponse<Court>>(
        this.baseUrl,
        courtData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to create court");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update an existing court
  async updateCourt(
    courtId: number,
    courtData: UpdateCourtRequest
  ): Promise<Court> {
    try {
      const response = await api.put<ApiResponse<Court>>(
        `${this.baseUrl}/${courtId}`,
        courtData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to update court");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete a court
  async deleteCourt(courtId: number): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `${this.baseUrl}/${courtId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete court");
      }
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Toggle court active status
  async toggleCourtStatus(courtId: number): Promise<Court> {
    try {
      const response = await api.patch<ApiResponse<Court>>(
        `${this.baseUrl}/${courtId}/toggle-status`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to toggle court status");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get court statistics for a venue owner
  async getCourtStats(venueId?: number): Promise<{
    totalCourts: number;
    activeCourts: number;
    inactiveCourts: number;
    totalBookings: number;
    revenue: number;
  }> {
    try {
      const params = venueId ? { venueId } : {};
      const response = await api.get<
        ApiResponse<{
          totalCourts: number;
          activeCourts: number;
          inactiveCourts: number;
          totalBookings: number;
          revenue: number;
        }>
      >(`${this.baseUrl}/stats`, { params });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to fetch court statistics"
      );
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Check court availability for a specific date and time
  async checkAvailability(
    courtId: number,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<{ available: boolean }>>(
        `${this.baseUrl}/${courtId}/availability`,
        {
          params: { date, startTime, endTime },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.available;
      }

      return false;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const courtService = new CourtService();
export default courtService;
