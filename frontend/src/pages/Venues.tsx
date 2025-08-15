import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Star,
  Filter,
  X,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useVenues } from "@/services/venueService";
import { VenueSearchParams, Venue } from "@/lib/types";
import { getVenueSportImage } from "@/utils/sportImages";

const VenueCard = ({
  venue,
  isLoading,
}: {
  venue?: Venue;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="relative h-48">
          <Skeleton className="h-full w-full" />
        </div>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!venue) return null;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            venue.photos && venue.photos.length > 0 
              ? venue.photos[0] 
              : getVenueSportImage(
                  venue.available_sports,
                  venue.amenities,
                  venue.name,
                  venue.description
                )
          }
          alt={venue.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // If venue photo fails, try sport image, then placeholder
            if (venue.photos && venue.photos.length > 0 && target.src === venue.photos[0]) {
              target.src = getVenueSportImage(
                venue.available_sports,
                venue.amenities,
                venue.name,
                venue.description
              );
            } else {
              target.src = "/placeholder.svg";
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-black">
            {venue.amenities?.includes("Indoor") ||
            venue.amenities?.includes("AC")
              ? "Indoor"
              : "Outdoor"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="bg-white/90 border-white text-black"
          >
            {venue.isApproved ? "Verified" : "Pending"}
          </Badge>
        </div>
        {/* Photos count overlay */}
        {venue.photos && venue.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
            +{venue.photos.length - 1} more
          </div>
        )}
        {venue.available_sports && venue.available_sports.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="default" className="bg-blue-600 text-white">
              {venue.available_sports[0]}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold line-clamp-1">
          {venue.name}
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{venue.location}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {venue.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{venue.rating || 4.5}</span>
              <span className="text-sm text-gray-500">
                ({venue.totalReviews || 0})
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">₹{venue.min_price || 300}/hr</p>
              <p className="text-xs text-gray-500">Starting from</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {venue.available_sports && venue.available_sports.length > 0 ? (
              // Show available sports
              venue.available_sports
                .slice(0, 3)
                .map((sport: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {sport}
                  </Badge>
                ))
            ) : venue.amenities?.length > 0 ? (
              // Fallback to amenities
              venue.amenities
                .slice(0, 3)
                .map((amenity: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))
            ) : (
              // Default amenities
              <>
                <Badge variant="outline" className="text-xs">
                  AC
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Parking
                </Badge>
              </>
            )}
            {venue.available_sports && venue.available_sports.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{venue.available_sports.length - 3} more
              </Badge>
            )}
          </div>

          <Button asChild className="w-full">
            <Link to={`/venue/${venue.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Venues = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("all"); // indoor/outdoor
  const [priceRange, setPriceRange] = useState([2000]);
  const [minRating, setMinRating] = useState("all");
  const [sortBy, setSortBy] = useState<
    "rating" | "price" | "name" | "created_at" | "distance"
  >("rating");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  // Extended sports list
  const availableSports = [
    "Cricket",
    "Football",
    "Volleyball",
    "Tennis",
    "Swimming",
    "Table Tennis",
    "Badminton",
    "Basketball",
    "Hockey",
    "Squash",
  ];

  // Common amenities for filtering
  const availableAmenities = [
    "Parking",
    "Restrooms",
    "Changing Rooms",
    "Cafeteria",
    "First Aid",
    "Equipment Rental",
    "Lockers",
    "WiFi",
    "Air Conditioning",
    "Shower",
    "Security",
    "CCTV",
  ];

  // Prepare search parameters
  const searchParams: VenueSearchParams = useMemo(() => {
    const params: VenueSearchParams = {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      sortBy,
      sortOrder,
    };

    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (locationQuery.trim()) params.location = locationQuery.trim();
    if (selectedSports.length > 0) params.sportType = selectedSports[0]; // API accepts one sport
    if (minRating !== "all") params.minRating = parseFloat(minRating);
    if (priceRange[0] < 2000) params.maxPrice = priceRange[0];
    if (selectedType !== "all") params.venueType = selectedType;

    return params;
  }, [
    searchQuery,
    locationQuery,
    selectedSports,
    selectedType,
    minRating,
    priceRange,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  // Fetch data using React Query
  const {
    data: venuesData,
    isLoading: venuesLoading,
    error: venuesError,
    refetch,
  } = useVenues(searchParams);

  // Memoize venues data
  const venues = useMemo(() => venuesData?.venues || [], [venuesData?.venues]);
  const totalVenues = venuesData?.pagination?.total || 0;
  const hasNextPage = venuesData?.pagination?.hasNext || false;

  // Apply client-side amenities filtering for display
  const displayVenues = useMemo(() => {
    const baseVenues = venues;
    if (selectedAmenities.length === 0) return baseVenues;

    return baseVenues.filter((venue) => {
      if (!venue.amenities || venue.amenities.length === 0) return false;
      return selectedAmenities.every((amenity) =>
        venue.amenities.some((venueAmenity) =>
          venueAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
    });
  }, [venues, selectedAmenities]);

  // Handle loading and error states
  if (venuesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load venues. Please try again.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSportToggle = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
    setCurrentPage(1);
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedSports([]);
    setSelectedAmenities([]);
    setSelectedType("all");
    setPriceRange([2000]);
    setMinRating("all");
    setSortBy("rating");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (locationQuery.trim()) count++;
    if (selectedSports.length > 0) count++;
    if (selectedAmenities.length > 0) count++;
    if (selectedType !== "all") count++;
    if (priceRange[0] < 2000) count++;
    if (minRating !== "all") count++;
    return count;
  };

  return (
    <>
      <SEO
        title="All Venues – QuickCourt"
        description="Browse all approved sports venues. Filter by sport, price, location, and rating to find your perfect court."
      />
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Venues</h1>
            <p className="text-gray-600">
              {venuesLoading
                ? "Loading venues..."
                : `Found ${totalVenues} venues`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters{" "}
              {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>

            {getActiveFiltersCount() > 0 && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Clear Filters ({getActiveFiltersCount()})
                </span>
                <span className="sm:hidden">
                  Clear ({getActiveFiltersCount()})
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search
                  </label>
                  <Input
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Location
                  </label>
                  <Input
                    placeholder="City or area..."
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Sports Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Sports
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableSports.map((sport) => (
                      <div key={sport} className="flex items-center space-x-2">
                        <Checkbox
                          id={sport}
                          checked={selectedSports.includes(sport)}
                          onCheckedChange={() => handleSportToggle(sport)}
                        />
                        <Label
                          htmlFor={sport}
                          className="text-sm cursor-pointer"
                        >
                          {sport}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Amenities
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableAmenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <Label
                          htmlFor={`amenity-${amenity}`}
                          className="text-sm cursor-pointer"
                        >
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Venue Type Filter (Indoor/Outdoor) */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Venue Type
                  </label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="indoor">Indoor</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Max Price: ₹{priceRange[0]}/hour
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => {
                      setPriceRange(value);
                      setCurrentPage(1);
                    }}
                    max={2000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Minimum Rating
                  </label>
                  <Select
                    value={minRating}
                    onValueChange={(value) => {
                      setMinRating(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                      <SelectItem value="4.0">4.0+ stars</SelectItem>
                      <SelectItem value="3.5">3.5+ stars</SelectItem>
                      <SelectItem value="3.0">3.0+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Venues Grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(
                    value:
                      | "rating"
                      | "price"
                      | "name"
                      | "created_at"
                      | "distance"
                  ) => setSortBy(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortOrder}
                  onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">High to Low</SelectItem>
                    <SelectItem value="asc">Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  {totalVenues} results
                </Button>
              </div>
            </div>

            {/* Fallback Message */}
            {venuesData?.fallbackMessage && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {venuesData.fallbackMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Venues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {venuesLoading ? (
                // Loading skeletons
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <VenueCard key={index} isLoading />
                ))
              ) : displayVenues.length > 0 ? (
                displayVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">
                    No venues found matching your criteria
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            {!venuesLoading && venues.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalVenues)} of{" "}
                  {totalVenues} venues
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {currentPage} of {Math.ceil(totalVenues / itemsPerPage)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.ceil(totalVenues / itemsPerPage))
                    }
                    disabled={!hasNextPage}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Venues;
