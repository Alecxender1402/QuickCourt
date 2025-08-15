import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  CheckCircle,
  X,
  Clock,
  MapPin,
  Star,
  Camera,
  Wifi,
  Car,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminVenues, useReviewVenue } from "@/services/adminService";
import {
  useLogin,
  isAuthenticated,
  getCurrentUserFromStorage,
} from "@/services/authService";
import { Venue } from "@/lib/types";
import { Input } from "@/components/ui/input";

const FacilityApproval = () => {
  const [selectedFacility, setSelectedFacility] = useState<Venue | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "pending" | "approved" | "all"
  >("pending");

  // Login state
  const [showLogin, setShowLogin] = useState(!isAuthenticated());
  const [email, setEmail] = useState("admin@quickcourt.com");
  const [password, setPassword] = useState("admin123");
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { toast } = useToast();
  const loginMutation = useLogin();

  // API hooks
  const {
    data: venuesData,
    isLoading,
    error,
    refetch,
  } = useAdminVenues({
    status: filterStatus,
    limit: 50,
    offset: 0,
  });

  const reviewVenueMutation = useReviewVenue();

  const venues = venuesData?.items || [];
  const totalCount = venuesData?.pagination?.total || 0;

  // Image gallery functions
  const nextImage = (venue: Venue) => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % venue.photos.length);
    }
  };

  const prevImage = (venue: Venue) => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + venue.photos.length) % venue.photos.length);
    }
  };

  const resetImageIndex = () => {
    setCurrentImageIndex(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", { email, password: "***" });
      const result = await loginMutation.mutateAsync({ email, password });
      console.log("Login successful:", result);
      setShowLogin(false);
      toast({
        title: "Login successful! ✅",
        description: "You are now authenticated as an admin.",
      });
      // Force refetch of venues after login
      refetch();
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Check authentication status
  const user = getCurrentUserFromStorage();
  const isAdmin = user?.role === "admin";

  if (showLogin || !isAuthenticated() || !isAdmin) {
    return (
      <div className="container py-10">
        <SEO
          title="Admin Login – QuickCourt"
          description="Admin authentication required."
        />
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="text-center">
                Admin Login Required
              </CardTitle>
              <p className="text-center text-gray-600">
                Please login with admin credentials to access facility approval.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@quickcourt.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
                </Button>
              </form>
              {!isAdmin && user && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Current user ({user.email}) does not have admin privileges.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleApprove = async (venueId: number) => {
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please login to perform this action.",
        variant: "destructive",
      });
      setShowLogin(true);
      return;
    }

    try {
      await reviewVenueMutation.mutateAsync({
        venueId,
        data: { action: "approve" },
      });
      toast({
        title: "Facility approved! ✅",
        description:
          "The facility has been approved and is now live on the platform.",
      });
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to approve the facility. Please try again.";

      if (
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized")
      ) {
        toast({
          title: "Authentication expired",
          description: "Please login again to continue.",
          variant: "destructive",
        });
        setShowLogin(true);
      } else {
        toast({
          title: "Error approving facility",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleReject = async (venueId: number, reason: string) => {
    const token = localStorage.getItem("token");
    console.log(
      "Rejection attempt - Token exists:",
      !!token,
      "VenueId:",
      venueId,
      "Reason:",
      reason
    );

    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please login to perform this action.",
        variant: "destructive",
      });
      setShowLogin(true);
      return;
    }

    try {
      console.log("Sending rejection request...");
      const result = await reviewVenueMutation.mutateAsync({
        venueId,
        data: {
          action: "reject",
          rejectionReason: reason,
        },
      });
      console.log("Rejection successful:", result);
      toast({
        title: "Facility rejected",
        description:
          "The facility owner has been notified with the rejection reason.",
        variant: "destructive",
      });
      setRejectReason("");
      setIsRejectDialogOpen(false); // Close the dialog
      refetch();
    } catch (error) {
      console.error("Rejection error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reject the facility. Please try again.";

      if (
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized")
      ) {
        toast({
          title: "Authentication expired",
          description: "Please login again to continue.",
          variant: "destructive",
        });
        setShowLogin(true);
      } else if (
        errorMessage.includes("rejectionReason") ||
        errorMessage.includes("Invalid value") ||
        errorMessage.includes("length")
      ) {
        toast({
          title: "Invalid rejection reason",
          description:
            "Rejection reason must be between 10 and 500 characters long.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error rejecting facility",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleFilterChange = (value: string) => {
    setFilterStatus(value as "pending" | "approved" | "all");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "parking":
        return <Car className="w-4 h-4" />;
      case "ac":
        return "❄️";
      default:
        return "✓";
    }
  };

  return (
    <div className="container py-10">
      <SEO
        title="Facility Approval – QuickCourt"
        description="Approve or reject facility registrations with comments."
      />
      <PageHeader title="Facility Approval" />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-semibold">
                Pending Approvals ({totalCount})
              </h2>
            </div>
            <p className="text-gray-600">
              Review and approve new facility submissions
            </p>
          </div>
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">⏳ Pending</SelectItem>
              <SelectItem value="approved">✅ Approved</SelectItem>
              <SelectItem value="all">📋 All Venues</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading
          ? // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </Card>
            ))
          : venues.map((venue) => (
              <Card
                key={venue.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Featured Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        {venue.photos && venue.photos.length > 0 ? (
                          <img
                            src={venue.photos[0]}
                            alt={venue.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {venue.photos && venue.photos.length > 1 && (
                        <div className="text-xs text-gray-500 text-center mt-1">
                          +{venue.photos.length - 1} more
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">
                              {venue.name}
                            </h3>
                            <Badge
                              variant={getStatusBadgeVariant(
                                venue.isApproved ? "approved" : "pending"
                              )}
                            >
                              {venue.isApproved ? "✅ APPROVED" : "⏳ PENDING"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {venue.location}
                            </span>
                            <span>
                              📅 Submitted:{" "}
                              {new Date(venue.createdAt).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">🏢 Facility</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2">Contact Details</h4>
                          <div className="space-y-1 text-sm">
                            <div>
                              <strong>Email:</strong> {venue.contactEmail}
                            </div>
                            <div>
                              <strong>Phone:</strong> {venue.contactPhone}
                            </div>
                            <div>
                              <strong>Address:</strong> {venue.address}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Facility Info</h4>
                          <div className="space-y-1 text-sm">
                            <div>
                              <strong>Rating:</strong>{" "}
                              {venue.rating
                                ? `${venue.rating}/5`
                                : "No ratings yet"}
                            </div>
                            <div>
                              <strong>Reviews:</strong>{" "}
                              {venue.totalReviews || 0}
                            </div>
                            <div>
                              <strong>ID:</strong> #{venue.id}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Description</h4>
                          <div className="text-sm text-gray-600">
                            {venue.description
                              ? venue.description.substring(0, 100) +
                                (venue.description.length > 100 ? "..." : "")
                              : "No description provided"}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Amenities</h4>
                        <div className="flex gap-2 flex-wrap">
                          {venue.amenities && venue.amenities.length > 0 ? (
                            venue.amenities.map((amenity, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {getAmenityIcon(amenity)} {amenity}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              No amenities listed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFacility(venue);
                              resetImageIndex();
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Facility Details - {venue.name}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedFacility &&
                            selectedFacility.id === venue.id && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-medium mb-3">
                                      Complete Address
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <div>{venue.address}</div>
                                      <div>{venue.location}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-3">
                                      Contact Information
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <div>
                                        <strong>Email:</strong>{" "}
                                        {venue.contactEmail}
                                      </div>
                                      <div>
                                        <strong>Phone:</strong>{" "}
                                        {venue.contactPhone}
                                      </div>
                                      <div>
                                        <strong>Venue ID:</strong> #{venue.id}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">
                                    Facility Description
                                  </h4>
                                  <div className="text-sm">
                                    {venue.description ||
                                      "No description provided"}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">
                                    All Amenities
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {venue.amenities &&
                                    venue.amenities.length > 0 ? (
                                      venue.amenities.map((amenity, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          {getAmenityIcon(amenity)}
                                          <span>{amenity}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-sm text-gray-500">
                                        No amenities listed
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">
                                    Facility Stats
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                      <div className="font-medium">Rating</div>
                                      <div className="text-lg font-bold text-orange-600">
                                        {venue.rating
                                          ? `${venue.rating}/5`
                                          : "No ratings yet"}
                                      </div>
                                    </div>
                                    <div className="border rounded-lg p-4">
                                      <div className="font-medium">
                                        Total Reviews
                                      </div>
                                      <div className="text-lg font-bold text-blue-600">
                                        {venue.totalReviews || 0}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Image Gallery Section */}
                                <div>
                                  <h4 className="font-medium mb-3">
                                    Facility Images
                                  </h4>
                                  {venue.photos && venue.photos.length > 0 ? (
                                    <div className="space-y-4">
                                      {/* Main Image Display */}
                                      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                          src={venue.photos[currentImageIndex]}
                                          alt={`${venue.name} - Image ${currentImageIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        
                                        {venue.photos.length > 1 && (
                                          <>
                                            <button
                                              onClick={() => prevImage(venue)}
                                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                            >
                                              <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                              onClick={() => nextImage(venue)}
                                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                            >
                                              <ChevronRight className="w-5 h-5" />
                                            </button>
                                            
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
                                              <span className="text-white text-sm">
                                                {currentImageIndex + 1} / {venue.photos.length}
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Thumbnail Navigation */}
                                      {venue.photos.length > 1 && (
                                        <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
                                          {venue.photos.map((photo, index) => (
                                            <button
                                              key={index}
                                              onClick={() => setCurrentImageIndex(index)}
                                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                                index === currentImageIndex
                                                  ? 'border-blue-500'
                                                  : 'border-transparent hover:border-gray-300'
                                              }`}
                                            >
                                              <img
                                                src={photo}
                                                alt={`${venue.name} thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <div className="text-center text-gray-500">
                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No images available</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </DialogContent>
                      </Dialog>

                      {!venue.isApproved && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Approve Facility
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve "{venue.name}
                                  "? This facility will be live on the platform
                                  and users can start booking.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleApprove(venue.id)}
                                >
                                  Approve Facility
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Dialog
                            open={isRejectDialogOpen}
                            onOpenChange={setIsRejectDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Reject Facility - {venue.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">
                                    Reason for rejection:
                                  </label>
                                  <Textarea
                                    placeholder="Please provide a detailed reason for rejection (minimum 10 characters)..."
                                    value={rejectReason}
                                    onChange={(e) =>
                                      setRejectReason(e.target.value)
                                    }
                                    className="mt-2"
                                    rows={4}
                                  />
                                  <div className="mt-1 text-xs text-gray-500">
                                    {rejectReason.length}/500 characters
                                    {rejectReason.length < 10 && (
                                      <span className="text-red-500 ml-2">
                                        (minimum 10 characters required)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsRejectDialogOpen(false);
                                      setRejectReason("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleReject(venue.id, rejectReason)
                                    }
                                    disabled={
                                      rejectReason.trim().length < 10 ||
                                      rejectReason.trim().length > 500 ||
                                      reviewVenueMutation.isPending
                                    }
                                  >
                                    {reviewVenueMutation.isPending
                                      ? "Rejecting..."
                                      : "Reject Facility"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

        {!isLoading && venues.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">🏟️</div>
              <h3 className="text-lg font-medium mb-2">No facilities found</h3>
              <p>No facilities match the current filter criteria.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FacilityApproval;
