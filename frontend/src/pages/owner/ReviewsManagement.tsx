import React, { useState } from "react";
import { 
  Star, 
  Filter, 
  Calendar, 
  User, 
  MessageCircle, 
  ThumbsUp,
  MapPin,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTimeRange } from "@/utils/timeUtils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVenueOwnerReviews, useMyVenues } from "@/services/venueService";
import { formatDistanceToNow } from "date-fns";

const ReviewsManagement = () => {
  const [filters, setFilters] = useState({
    venueId: undefined as number | undefined,
    rating: undefined as number | undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Fetch data
  const { data: myVenues } = useMyVenues();
  const { data: reviewsData, isLoading, refetch } = useVenueOwnerReviews({
    ...filters,
    limit,
    offset: currentPage * limit,
  });

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;

  // Filter reviews by search term
  const filteredReviews = reviews.filter(review => 
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.venue.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  // Get rating badge color
  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800";
    if (rating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Calculate statistics
  const totalReviews = pagination?.total || 0;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length * 100).toFixed(1)
      : "0"
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage customer reviews for your venues</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Reviews
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{totalReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold">{averageRating}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Positive Reviews</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => r.rating >= 4).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Venues</p>
                  <p className="text-2xl font-bold">{myVenues?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={filters.venueId?.toString() || "all"}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      venueId: value === "all" ? undefined : parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {myVenues?.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id.toString()}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.rating?.toString() || "all"}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      rating: value === "all" ? undefined : parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-');
                      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Newest First</SelectItem>
                      <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                      <SelectItem value="rating-desc">Highest Rating</SelectItem>
                      <SelectItem value="rating-asc">Lowest Rating</SelectItem>
                      <SelectItem value="helpfulCount-desc">Most Helpful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading reviews...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                    <p className="text-gray-600">
                      {searchTerm ? "Try adjusting your search criteria." : "Your venues haven't received any reviews yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredReviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{review.user.name}</h3>
                            <p className="text-sm text-gray-600">{review.user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {renderStars(review.rating)}
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{review.venue.name}</span>
                          <Badge className={getRatingBadgeColor(review.rating)}>
                            {review.rating} Star{review.rating !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        )}
                      </div>

                      {review.booking && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Booking: {new Date(review.booking.bookingDate).toLocaleDateString()} 
                              {' '}at {formatTimeRange(review.booking.startTime, review.booking.endTime)}
                            </span>
                          </div>
                        </div>
                      )}

                      {review.helpfulCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{review.helpfulCount} people found this helpful</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > limit && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, pagination.total)} of {pagination.total} reviews
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNext}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm">{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-400 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReviewsManagement;
