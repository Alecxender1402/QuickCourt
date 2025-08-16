import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Wifi,
  Car,
  Coffee,
  Shield,
  Heart,
  Flag,
  Users,
  Calendar,
  MapIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Camera,
  Navigation,
  ExternalLink,
  Play,
  Image as ImageIcon,
  X,
  AlertTriangle,
} from "lucide-react";
import { useVenueDetails, useSportPricing } from "@/services/venueService";
import { useVenueReviews, useCreateReview } from "@/services/reviewService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Review } from "@/lib/types";

const VenueDetails = () => {
  const { id } = useParams();
  const venueId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showSportModal, setShowSportModal] = useState(false);

  // API calls
  const {
    data: venue,
    isLoading: venueLoading,
    error: venueError,
    refetch: refetchVenue,
  } = useVenueDetails(venueId);
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useVenueReviews(venueId);
  const { data: sportPricing, isLoading: pricingLoading } = useSportPricing(
    venueId,
    selectedSport || ""
  );
  const createReviewMutation = useCreateReview();

  const reviews = reviewsData?.items || [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  const handleSportClick = (sport: string) => {
    setSelectedSport(sport.toLowerCase());
    setShowSportModal(true);
  };

  const handleBookVenue = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a venue",
        variant: "destructive",
      });
      return;
    }

    // Check if venue has courts available
    if (venue?.courts && venue.courts.length > 0) {
      // Scroll to courts section
      const courtsSection = document.querySelector("[data-courts-section]");
      if (courtsSection) {
        courtsSection.scrollIntoView({ behavior: "smooth" });
        toast({
          title: "Select a Court",
          description:
            "Please choose a court from the available options below.",
        });
        return;
      }
    }

    // Navigate to generic booking page if no courts
    navigate(`/booking/${venueId}`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive",
      });
      return;
    }

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please login again to submit a review",
        variant: "destructive",
      });
      return;
    }

    // Validate rating and comment
    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please select a rating between 1 and 5 stars",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        venueId,
        rating: reviewRating,
        comment: reviewComment.trim(),
        // bookingId is now optional - removed hardcoded value
      });

      toast({
        title: "Review Submitted Successfully!",
        description: "Thank you for your feedback! You can add more reviews anytime.",
      });

      // Force refresh the data
      await Promise.all([
        refetchReviews(),
        refetchVenue(),
      ]);

      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (error: any) {
      console.error('Review submission error:', error);
      
      let errorMessage = "Failed to submit review. Please try again.";
      
      if (error?.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to submit a review.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            } ${
              interactive
                ? "cursor-pointer hover:scale-110 transition-transform"
                : ""
            }`}
            onClick={() =>
              interactive && onRatingChange && onRatingChange(star)
            }
          />
        ))}
      </div>
    );
  };

  const nextImage = () => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % venue.photos.length);
    }
  };

  const prevImage = () => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + venue.photos.length) % venue.photos.length
      );
    }
  };

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load venue details</p>
          <Link to="/venues">
            <Button variant="outline">Back to Venues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${venue.name} - QuickCourt`}
        description={`Book ${venue.name} at ${venue.location}. Rating: ${venue.rating}/5 with ${venue.totalReviews} reviews.`}
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/venues"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Venues
          </Link>
        </div>

        {/* Venue Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {venue.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{venue.rating}</span>
                  <span>({venue.totalReviews || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Images/Videos Section */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    {venue.photos && venue.photos.length > 0 ? (
                      <img
                        src={venue.photos[currentImageIndex]}
                        alt={`${venue.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                          <p>No images available</p>
                        </div>
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {venue.photos && venue.photos.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image Counter */}
                  {venue.photos && venue.photos.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {venue.photos.length}
                    </div>
                  )}

                  {/* Media Type Indicator */}
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Images / Videos
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Courts */}
            <Card data-courts-section>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Available Courts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {venue.courts && venue.courts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venue.courts.map((court) => (
                      <div
                        key={court.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-green-200 hover:bg-green-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">
                              {court.sportType.toLowerCase() === "badminton"
                                ? "🏸"
                                : court.sportType.toLowerCase() === "tennis"
                                ? "🎾"
                                : court.sportType.toLowerCase() === "football"
                                ? "⚽"
                                : court.sportType.toLowerCase() === "cricket" ||
                                  court.sportType
                                    .toLowerCase()
                                    .includes("cricket")
                                ? "🏏"
                                : court.sportType.toLowerCase() === "swimming"
                                ? "🏊"
                                : court.sportType.toLowerCase() ===
                                  "table tennis"
                                ? "🏓"
                                : "🏟️"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{court.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {court.sportType}
                              </Badge>
                              <span className="text-sm text-green-600 font-medium">
                                ₹{court.pricePerHour}/hr
                              </span>
                            </div>
                            {court.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {court.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (!user) {
                                toast({
                                  title: "Login Required",
                                  description: "You must login first for booking venue",
                                  variant: "destructive",
                                });
                                return;
                              }
                              navigate(
                                `/booking/court?venueId=${venueId}&courtId=${court.id}`
                              );
                            }}
                          >
                            Book Court
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSportClick(court.sportType)}
                          >
                            View Pricing
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : venue.available_sports &&
                  venue.available_sports.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {venue.available_sports.map((sport, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-200 border-2 border-transparent transition-all"
                          onClick={() => handleSportClick(sport)}
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">
                              {sport.toLowerCase() === "badminton"
                                ? "🏸"
                                : sport.toLowerCase() === "tennis"
                                ? "🎾"
                                : sport.toLowerCase() === "football"
                                ? "⚽"
                                : sport.toLowerCase() === "cricket" ||
                                  sport.toLowerCase().includes("cricket")
                                ? "🏏"
                                : sport.toLowerCase() === "swimming"
                                ? "🏊"
                                : sport.toLowerCase() === "table tennis"
                                ? "🏓"
                                : "🏟️"}
                            </span>
                          </div>
                          <span className="font-medium capitalize">
                            {sport}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No courts are currently set up for this venue. Please
                        contact the venue directly.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No courts information available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sport Pricing Modal */}
            <Dialog open={showSportModal} onOpenChange={setShowSportModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span className="capitalize">{selectedSport}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSportModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </DialogTitle>
                </DialogHeader>

                {pricingLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading pricing...</p>
                  </div>
                ) : sportPricing ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Pricing is subjected to change and is controlled by
                        venue
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {sportPricing.name}
                        </h3>
                      </div>

                      {/* Monday - Friday */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Monday - Friday
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>
                              INR {sportPricing.weekdays.morning.price}.0 / hour
                            </span>
                            <span className="text-sm text-gray-600">
                              {sportPricing.weekdays.morning.time}
                            </span>
                          </div>
                          {sportPricing.weekdays.afternoon && (
                            <div className="flex justify-between items-center">
                              <span>
                                INR {sportPricing.weekdays.afternoon.price}.0 /
                                hour
                              </span>
                              <span className="text-sm text-gray-600">
                                {sportPricing.weekdays.afternoon.time}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span>
                              INR {sportPricing.weekdays.evening.price}.0 / hour
                            </span>
                            <span className="text-sm text-gray-600">
                              {sportPricing.weekdays.evening.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Saturday - Sunday */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Saturday - Sunday
                        </h4>
                        <div className="flex justify-between items-center">
                          <span>
                            INR {sportPricing.weekend.allDay.price}.0 / hour
                          </span>
                          <span className="text-sm text-gray-600">
                            {sportPricing.weekend.allDay.time}
                          </span>
                        </div>
                      </div>

                      {/* Holiday(s) */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Holiday(s)
                        </h4>
                        <div className="flex justify-between items-center">
                          <span>
                            INR {sportPricing.holiday.allDay.price}.0 / hour
                          </span>
                          <span className="text-sm text-gray-600">
                            {sportPricing.holiday.allDay.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Pricing information not available</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {venue.amenities && venue.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {venue.amenities.map((amenity, index) => {
                      const getAmenityIcon = (name: string) => {
                        const lowerName = name.toLowerCase();
                        if (lowerName.includes("parking"))
                          return <Car className="w-4 h-4" />;
                        if (lowerName.includes("wifi"))
                          return <Wifi className="w-4 h-4" />;
                        if (
                          lowerName.includes("coffee") ||
                          lowerName.includes("cafe")
                        )
                          return <Coffee className="w-4 h-4" />;
                        if (
                          lowerName.includes("cctv") ||
                          lowerName.includes("security")
                        )
                          return <Shield className="w-4 h-4" />;
                        return <Shield className="w-4 h-4" />;
                      };

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
                        >
                          <div className="text-green-600">
                            {getAmenityIcon(amenity)}
                          </div>
                          <span className="text-sm">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No amenities information available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* About Venue */}
            <Card>
              <CardHeader>
                <CardTitle>About Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  {venue.description ? (
                    <p className="text-gray-700 leading-relaxed">
                      {venue.description}
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      No description available for this venue.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Player Reviews & Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Player Reviews & Ratings
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Login Required",
                          description: "Please login to write a review",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const token = localStorage.getItem("token");
                      if (!token) {
                        toast({
                          title: "Authentication Error",
                          description: "Please login again to write a review",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setShowReviewForm(true);
                    }}
                    disabled={!user}
                  >
                    Add Your Review
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Review Form */}
                {showReviewForm && (
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          {renderStars(reviewRating, true, setReviewRating)}
                        </div>
                        <div>
                          <Label htmlFor="comment">Your Review</Label>
                          <Textarea
                            id="comment"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience..."
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={createReviewMutation.isPending}
                          >
                            {createReviewMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Submit Review
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading reviews...</p>
                  </div>
                ) : displayedReviews.length > 0 ? (
                  <div className="space-y-4">
                    {displayedReviews.map((review: Review) => (
                      <div
                        key={review.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {(review.user_name || review.user?.name)
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {review.user_name ||
                                  review.user?.name ||
                                  "Anonymous"}
                              </p>
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating)}
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    review.created_at || review.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}

                    {/* Load More Button */}
                    {reviews.length > 5 && !showAllReviews && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowAllReviews(true)}
                        >
                          Load More Reviews ({reviews.length - 5} more)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Book This Venue */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleBookVenue}
                  >
                    {venue?.courts && venue.courts.length > 0
                      ? "Select Court to Book"
                      : "Book This Venue"}
                  </Button>
                  {venue?.courts && venue.courts.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {venue.courts.length} courts available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {venue.operatingHours ? (
                  <div className="space-y-2">
                    {Object.entries(venue.operatingHours).map(
                      ([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}</span>
                          <span className="text-gray-600">
                            {typeof hours === "string"
                              ? hours
                              : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">7:00AM - 11:00PM</p>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    {venue.address || venue.location}
                  </p>
                  {venue.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{venue.contactPhone}</span>
                    </div>
                  )}
                  {venue.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{venue.contactEmail}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5" />
                  Location Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>Map integration coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
