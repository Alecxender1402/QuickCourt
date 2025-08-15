// User types
export type UserRole = "user" | "facility_owner" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string | null;
  phone?: string | null;
  lastLogin?: string | null;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// Venue types
export interface Venue {
  id: number;
  name: string;
  description: string;
  location: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  amenities: string[];
  photos?: string[]; // Array of photo URLs
  available_sports?: string[]; // Sports available at this venue
  min_price?: number; // Minimum price from courts
  max_price?: number; // Maximum price from courts
  courts_count?: number; // Number of courts
  rating: number;
  totalReviews: number;
  isApproved: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt?: string;
  workingHours?: WorkingHours[]; // Venue working hours
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface VenueSearchParams {
  search?: string;
  location?: string;
  sportType?: string;
  venueType?: string; // indoor/outdoor
  minRating?: number;
  maxPrice?: number;
  sortBy?: "rating" | "price" | "distance" | "name" | "created_at";
  sortOrder?: "asc" | "desc"; // sort direction
  limit?: number;
  offset?: number;
}

export interface CreateVenueRequest {
  name: string;
  description: string;
  location: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  amenities: string[];
  courts?: {
    name: string;
    sportType: string;
    pricePerHour: number;
    operatingHours: {
      start: string;
      end: string;
    };
    maxPlayers: number;
    description?: string;
  }[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

// Working Hours types
export interface WorkingHours {
  id: number;
  venueId: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Time format: "HH:mm:ss"
  endTime: string; // Time format: "HH:mm:ss"
  isActive: boolean;
}

// Court types
export interface Court {
  id: number;
  venueId: number;
  name: string;
  sportType: string;
  description: string;
  pricePerHour: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  venue?: Venue;
}

export interface CreateCourtRequest {
  venueId: number;
  name: string;
  sportType: string;
  description: string;
  pricePerHour: number;
  capacity: number;
}

// Booking types
export interface Booking {
  id: number;
  userId: number;
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  court?: Court;
  venue?: Venue;
}

export interface CreateBookingRequest {
  venueId: number;
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  totalAmount: number;
}

export interface BookingSearchParams {
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  upcoming?: boolean;
  limit?: number;
  offset?: number;
}

// Review types
export interface Review {
  id: number;
  userId: number;
  venueId: number;
  bookingId: number;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  created_at?: string; // Backend compatibility
  updatedAt?: string;
  user?: User;
  user_name?: string; // Backend compatibility
  user_avatar?: string; // Backend compatibility
  venue?: Venue;
}

export interface CreateReviewRequest {
  venueId: number;
  bookingId?: number;
  rating: number;
  comment: string;
}

export interface ReviewSearchParams {
  rating?: number;
  sortBy?: "created_at" | "rating" | "helpful";
  limit?: number;
  offset?: number;
}

// Time Slot types
export interface TimeSlot {
  id: number;
  courtId: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlocked: boolean;
  blockReason?: string;
  bookingId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AvailableTimeSlotsResponse {
  court: {
    id: number;
    name: string;
    sportType: string;
    pricePerHour: number;
    venue: {
      id: number;
      name: string;
      isApproved: boolean;
    };
  };
  date: string;
  dayOfWeek: number;
  availableSlots: {
    id: number;
    venueId: number;
    courtId: number;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    formattedStartTime: string;
    formattedEndTime: string;
    duration: number;
    price: number;
    isAvailable: boolean;
    createdAt: string;
    courtName: string;
    sportType: string;
    pricePerHour: number;
  }[];
}

export interface BlockTimeSlotRequest {
  courtId: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

// Payment types
export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentIntentRequest {
  bookingId: number;
  amount: number;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface RefundRequest {
  reason: string;
  amount?: number;
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "venue_approved"
    | "venue_rejected"
    | "new_booking";
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPreferences {
  email_bookings: boolean;
  email_reminders: boolean;
  email_promotions: boolean;
  push_bookings: boolean;
  push_reminders: boolean;
  push_promotions: boolean;
  sms_bookings: boolean;
  sms_reminders: boolean;
}

export interface NotificationSearchParams {
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

// Admin types
export interface AdminDashboardStats {
  totalUsers: number;
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVenues: number;
  activeUsers: number;
  recentBookings: Booking[];
  topVenues: Venue[];
  trends?: TrendData[];
  recentActivities?: RecentActivity[];
}

export interface TrendData {
  month: string;
  bookings: number;
  revenue: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  timestamp: string;
  user_name: string;
  entity_type: string;
  entity_id: number;
}

// Backend response interfaces
export interface BackendDashboardStats {
  total_customers: number;
  total_owners: number;
  total_admins: number;
  total_users: number;
  total_venues: number;
  approved_venues: number;
  pending_venues: number;
  active_courts: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_reviews: number;
  total_revenue: number;
}

export interface BackendDashboardResponse {
  stats: BackendDashboardStats;
  trends: TrendData[];
  recentActivities: RecentActivity[];
  recentBookings: any[]; // Array of recent booking objects
  topVenues: any[]; // Array of top venue objects
}

export interface UserManagementParams {
  role?: "user" | "facility_owner" | "admin";
  search?: string;
  status?: "active" | "suspended";
  limit?: number;
  offset?: number;
}

export interface UserStatusUpdate {
  action: "suspend" | "activate";
  reason?: string;
}

export interface VenueReviewAction {
  action: "approve" | "reject";
  rejectionReason?: string;
}

export interface SystemReport {
  reportType: "bookings" | "revenue" | "users" | "venues";
  startDate: string;
  endDate: string;
  data: Record<string, unknown>;
}

// Venue Management (Owner) types
export interface VenueOwnerDashboard {
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
  activeVenues: number;
  pendingBookings: number;
  recentBookings: Booking[];
  venueStats: {
    venueId: number;
    venueName: string;
    bookingCount: number;
    revenue: number;
  }[];
}

// Sports and general types
export interface Sport {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface AvailabilityCheck {
  courtId: number;
  date: string;
  availableSlots: {
    startTime: string;
    endTime: string;
    price: number;
  }[];
}

export interface PopularVenue extends Venue {
  bookingCount: number;
  popularityScore: number;
}

// Venue Report types
export type VenueReportStatus =
  | "pending"
  | "reviewed"
  | "resolved"
  | "dismissed";

export interface VenueReport {
  id: number;
  reason: string;
  description: string;
  status: VenueReportStatus;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  venue: {
    id: number;
    name: string;
    location: string;
    owner_name: string;
    owner_email: string;
  };
  reviewed_by?: string;
}

export interface ReportStats {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  reports_by_reason: {
    reason: string;
    count: number;
  }[];
  recent_reports: {
    id: number;
    reason: string;
    user_name: string;
    venue_name: string;
    status: VenueReportStatus;
    created_at: string;
  }[];
}

export interface SubmitVenueReportRequest {
  reason:
    | "inappropriate_content"
    | "false_information"
    | "safety_concerns"
    | "poor_service"
    | "facility_issues"
    | "other";
  description: string;
}

export interface UpdateReportStatusRequest {
  status: VenueReportStatus;
  adminNotes?: string;
}
