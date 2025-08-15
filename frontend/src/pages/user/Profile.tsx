import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Eye,
  EyeOff,
  Star,
  X,
} from "lucide-react";
import { useUserBookings, useCancelBooking } from "@/services/bookingService";
import { useCreateReview } from "@/services/reviewService";
import {
  useUserProfile,
  useUpdateProfile,
  useChangePassword,
  useUserStats,
} from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Utility function to format time
const formatTime = (timeString) => {
  if (!timeString) return "";

  try {
    // Handle different time formats
    let hours, minutes;
    
    if (timeString.includes("T")) {
      // ISO format: "1970-01-01T09:00:00.000Z"
      const dateObj = new Date(timeString);
      hours = dateObj.getUTCHours();
      minutes = dateObj.getUTCMinutes();
    } else if (timeString.includes(":")) {
      // Simple format: "09:00" or "09:00:00"
      [hours, minutes] = timeString.split(":").map(Number);
    } else {
      return timeString; // Return as is if format is unknown
    }

    // Create proper date for display without timezone conversion
    const today = new Date();
    const time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);

    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Error formatting time:", timeString, error);
    return timeString; // Fallback to original string
  }
};

// Utility function to format time range
const formatTimeRange = (startTime, endTime) => {
  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};

// Utility function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate.getTime() === today.getTime()) {
      return "Today";
    } else if (bookingDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else if (bookingDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  } catch (error) {
    console.warn("Error formatting date:", dateString, error);
    return new Date(dateString).toLocaleDateString();
  }
};

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
  });

  // Cancel booking state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // Review state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
  });

  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // API hooks
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const cancelBookingMutation = useCancelBooking();
  const createReviewMutation = useCreateReview();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        phone: user.phone || "",
        oldPassword: "",
        newPassword: "",
      });
    } else if (authUser) {
      setFormData({
        fullName: authUser.name || "",
        phone: authUser.phone || "",
        oldPassword: "",
        newPassword: "",
      });
    }
  }, [user, authUser]);

  // Get real booking data from API - fetch more bookings for profile page
  const { data: bookingsData, isLoading: bookingsLoading } = useUserBookings({
    limit: 100, // Increased limit to show more bookings in profile
    offset: 0,
  });

  const bookings = bookingsData?.items || [];

  // Filter bookings based on active tab
  const filteredBookings =
    activeTab === "cancelled"
      ? bookings.filter((b) => b.status === "cancelled")
      : bookings; // Show all bookings when activeTab === "bookings"

  // Debug logging
  console.log("Profile page - Total bookings:", bookings.length);
  console.log("Profile page - Active tab:", activeTab);
  console.log("Profile page - Filtered bookings:", filteredBookings.length);
  console.log(
    "Profile page - Booking statuses:",
    bookings.map((b) => b.status)
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    const currentUser = user || authUser;
    setFormData({
      fullName: currentUser?.name || "",
      phone: currentUser?.phone || "",
      oldPassword: "",
      newPassword: "",
    });
  };

  const handleSave = async () => {
    try {
      // Update profile if name or phone changed
      const currentUser = user || authUser;
      if (formData.fullName !== currentUser?.name || formData.phone !== currentUser?.phone) {
        await updateProfileMutation.mutateAsync({
          name: formData.fullName,
          phone: formData.phone,
        });

        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }

      // Change password if provided
      if (formData.oldPassword && formData.newPassword) {
        await changePasswordMutation.mutateAsync({
          currentPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        });

        toast({
          title: "Password Changed",
          description: "Your password has been changed successfully.",
        });

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          oldPassword: "",
          newPassword: "",
        }));
      }

      setIsEditingProfile(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data
          ? (error.response.data as { message: string }).message
          : "Failed to update profile";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Cancel booking handlers
  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: selectedBooking.id,
        reason: cancelReason,
      });

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });

      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Review handlers
  const handleWriteReview = (booking) => {
    setSelectedBooking(booking);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking || reviewData.rating === 0) return;

    try {
      await createReviewMutation.mutateAsync({
        venueId: selectedBooking.venue.id,
        bookingId: selectedBooking.id,
        courtId: selectedBooking.court.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      setShowReviewDialog(false);
      setSelectedBooking(null);
      setReviewData({ rating: 0, comment: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-400"
            }`}
            onClick={() => !readonly && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="My Profile – QuickCourt"
        description="View and update your QuickCourt profile details."
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                  {userLoading ? (
                    <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  ) : (
                    <h3 className="font-semibold text-lg text-gray-900">
                      {(user || authUser)?.name || "User"}
                    </h3>
                  )}

                  {userLoading ? (
                    <Skeleton className="h-4 w-24 mx-auto mb-1" />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {(user || authUser)?.phone || "Phone not provided"}
                    </p>
                  )}

                  {userLoading ? (
                    <Skeleton className="h-4 w-36 mx-auto" />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {(user || authUser)?.email || "No email"}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>Total Bookings: {userStats?.totalBookings || 0}</p>
                      <p>Upcoming: {userStats?.upcomingBookings || 0}</p>
                      <p>Completed: {userStats?.completedBookings || 0}</p>
                    </div>
                  )}

                  <Button
                    variant={isEditingProfile ? "default" : "outline"}
                    className={`w-full ${
                      isEditingProfile
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : ""
                    }`}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant={!isEditingProfile ? "default" : "outline"}
                    className={`w-full ${
                      !isEditingProfile
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : ""
                    }`}
                    onClick={() => {
                      setActiveTab("bookings");
                      setIsEditingProfile(false);
                    }}
                  >
                    All Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-6">
                {isEditingProfile ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Edit Profile
                    </h2>
                    <div className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-600" />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            handleInputChange("fullName", e.target.value)
                          }
                          className="w-full"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      {/* Email - Read Only */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                          {(user || authUser)?.email || "No email"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Email address cannot be changed for security reasons
                        </p>
                      </div>

                      {/* Old Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Old Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showOldPassword ? "text" : "password"}
                            value={formData.oldPassword}
                            onChange={(e) =>
                              handleInputChange("oldPassword", e.target.value)
                            }
                            className="w-full pr-10"
                            placeholder="Enter your old password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                          >
                            {showOldPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) =>
                              handleInputChange("newPassword", e.target.value)
                            }
                            className="w-full pr-10"
                            placeholder="Enter your new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-center gap-4 pt-6">
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="px-8"
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={handleSave}
                          className="px-8 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-4 mb-6">
                      <Button
                        variant={
                          activeTab === "bookings" ? "default" : "outline"
                        }
                        className={`${
                          activeTab === "bookings"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }`}
                        onClick={() => setActiveTab("bookings")}
                      >
                        All Bookings ({bookings.length})
                      </Button>
                      <Button
                        variant={
                          activeTab === "cancelled" ? "default" : "outline"
                        }
                        className={`${
                          activeTab === "cancelled"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }`}
                        onClick={() => setActiveTab("cancelled")}
                      >
                        Cancelled (
                        {
                          bookings.filter((b) => b.status === "cancelled")
                            .length
                        }
                        )
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {bookingsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : filteredBookings.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {activeTab === "bookings"
                              ? "No bookings found"
                              : "No cancelled bookings found"}
                          </div>
                        ) : (
                          filteredBookings.map((booking) => (
                            <Card
                              key={booking.id}
                              className="bg-gray-50 border"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-medium text-gray-900">
                                      {booking.venue?.name || "Venue"} (
                                      {booking.court?.sportType || "Sport"})
                                    </h4>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={`${
                                      booking.status === "confirmed"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : booking.status === "completed"
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : booking.status === "cancelled"
                                        ? "bg-red-600 hover:bg-red-700 text-white"
                                        : booking.status === "pending"
                                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                        : "bg-gray-600 hover:bg-gray-700 text-white"
                                    }`}
                                  >
                                    {booking.status.charAt(0).toUpperCase() +
                                      booking.status.slice(1)}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {formatDate(booking.bookingDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatTimeRange(
                                        booking.startTime,
                                        booking.endTime
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                  <MapPin className="w-4 h-4" />
                                  <span>
                                    {booking.venue?.address ||
                                      "Location not available"}
                                  </span>
                                </div>

                                <div className="flex gap-2">
                                  {booking.status === "confirmed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleCancelBooking(booking)
                                      }
                                    >
                                      Cancel Booking
                                    </Button>
                                  )}
                                  {booking.status === "completed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleWriteReview(booking)}
                                    >
                                      Write Review
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}

                        {!bookingsLoading && filteredBookings.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>
                              {activeTab === "cancelled"
                                ? "No cancelled bookings found"
                                : "No bookings found"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to cancel this booking?</p>
            {selectedBooking && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">
                  {selectedBooking.venue?.name} - {selectedBooking.court?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedBooking.bookingDate)} from{" "}
                  {formatTimeRange(
                    selectedBooking.startTime,
                    selectedBooking.endTime
                  )}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cancellation Reason (Optional)
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending
                ? "Cancelling..."
                : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">
                  {selectedBooking.venue?.name} - {selectedBooking.court?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedBooking.bookingDate)} from{" "}
                  {formatTimeRange(
                    selectedBooking.startTime,
                    selectedBooking.endTime
                  )}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              <StarRating
                rating={reviewData.rating}
                onRatingChange={(rating) =>
                  setReviewData((prev) => ({ ...prev, rating }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Review
              </label>
              <Textarea
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Share your experience with this venue..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={
                reviewData.rating === 0 || createReviewMutation.isPending
              }
            >
              {createReviewMutation.isPending
                ? "Submitting..."
                : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
