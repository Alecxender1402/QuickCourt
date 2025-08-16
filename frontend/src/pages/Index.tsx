import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  MapPin,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Loader2,
  BellDot,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  Award,
  Target,
  BookOpen,
  Trophy,
  Heart,
  CalendarCheck,
  MessageSquare,
  ArrowRight,
  Filter,
  Zap,
  Shield,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePopularVenues, useSports } from "@/services/venueService";
import {
  useUpcomingBookings,
  useBookingHistory,
} from "@/services/bookingService";
import { useUnreadNotificationCount } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-quickcourt.jpg";
import { Venue, Booking } from "@/lib/types";
import { getVenueSportImage } from "@/utils/sportImages";

const cities = [
  "Ahmedabad",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Surat",
  "Rajkot",
  "Vadodara",
  "Gandhinagar",
];

// Helper function to get sport emoji
const getSportEmoji = (sportName: string) => {
  const sport = sportName.toLowerCase();
  switch (sport) {
    case "badminton":
      return "🏸";
    case "tennis":
      return "🎾";
    case "football":
      return "⚽";
    case "cricket":
      return "🏏";
    case "swimming":
      return "🏊";
    case "table tennis":
      return "🏓";
    case "basketball":
      return "🏀";
    case "volleyball":
      return "🏐";
    default:
      return "🏟️";
  }
};

// Helper function to get sport description
const getSportDescription = (sportName: string) => {
  const sport = sportName.toLowerCase();
  switch (sport) {
    case "badminton":
      return "Indoor racquet sport with shuttlecock";
    case "tennis":
      return "Racquet sport on court";
    case "football":
      return "Team sport played with feet";
    case "cricket":
      return "Bat and ball sport with wickets";
    case "swimming":
      return "Aquatic sport and exercise";
    case "table tennis":
      return "Indoor paddle sport";
    case "basketball":
      return "Team sport with hoops";
    case "volleyball":
      return "Team sport with net";
    default:
      return "Popular sport activity";
  }
};

const Index = () => {
  const [searchCity, setSearchCity] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Direct API call for venues
  const [venuesData, setVenuesData] = useState(null);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setVenuesLoading(true);
        const response = await fetch(
          "http://localhost:3000/api/public/venues/"
        );
        const data = await response.json();
        setVenuesData(data.data);
        setVenuesError(null);
      } catch (error) {
        setVenuesError(error);
        setVenuesData(null);
      } finally {
        setVenuesLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const { data: popularVenuesData, isLoading: popularVenuesLoading } =
    usePopularVenues("rating", 12);

  const { data: sportsData, isLoading: sportsLoading } = useSports();

  // User-specific data (only fetch if user is logged in)
  const { data: upcomingBookings, isLoading: bookingsLoading } =
    useUpcomingBookings();
  const { data: bookingHistory } = useBookingHistory(5); // Last 5 bookings
  const { data: unreadCount } = useUnreadNotificationCount({
    enabled: !!user,
  });

  // Filter cities based on search input
  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchCity.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setSearchCity(city);
    setShowSuggestions(false);
    // Optionally trigger venue search for the selected city
    toast({
      title: "City selected",
      description: `Searching venues in ${city}`,
    });
  };

  const detectCurrentLocation = () => {
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Get approximate city based on coordinates
        const detectedCity = getApproximateCity(latitude, longitude);
        setCurrentLocation(detectedCity);
        setSearchCity(detectedCity);
        setIsDetectingLocation(false);

        toast({
          title: "Location detected",
          description: `Found your location: ${detectedCity}`,
        });
      },
      (error) => {
        let errorMessage = "Unable to detect your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });

        // Fallback to default city
        setSearchCity("Ahmedabad");
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Simple function to get approximate city based on coordinates
  const getApproximateCity = (lat: number, lng: number) => {
    const cityCoordinates = [
      { name: "Mumbai", lat: 19.076, lng: 72.8777 },
      { name: "Delhi", lat: 28.6139, lng: 77.209 },
      { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
      { name: "Chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
      { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
      { name: "Pune", lat: 18.5204, lng: 73.8567 },
      { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    ];

    let closestCity = "Your Location";
    let minDistance = Infinity;

    cityCoordinates.forEach((city) => {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city.name;
      }
    });

    return closestCity;
  };

  // Auto-detect location on component mount
  useEffect(() => {
    const detectLocation = () => {
      setIsDetectingLocation(true);

      if (!navigator.geolocation) {
        toast({
          title: "Location Error",
          description: "Geolocation is not supported by this browser.",
          variant: "destructive",
        });
        setIsDetectingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Get approximate city based on coordinates
          const detectedCity = getApproximateCity(latitude, longitude);
          setCurrentLocation(detectedCity);
          setSearchCity(detectedCity);
          setIsDetectingLocation(false);

          toast({
            title: "Location detected",
            description: `Found your location: ${detectedCity}`,
          });
        },
        (error) => {
          let errorMessage = "Unable to detect your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }

          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });

          // Fallback to default city
          setSearchCity("Ahmedabad");
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    };

    detectLocation();
  }, [toast]);

  // Process venue data safely
  const venues = Array.isArray(popularVenuesData) ? popularVenuesData : [];
  const venuesPerPage = 3;
  const totalPages = Math.ceil(venues.length / venuesPerPage);
  const currentVenues = venues.slice(
    currentPage * venuesPerPage,
    (currentPage + 1) * venuesPerPage
  );

  // Fallback sports data
  const fallbackSports = [
    {
      name: "Badminton",
      image: "/badminton.jpg",
      id: 1,
    },
    {
      name: "Tennis",
      image: "/tennis.avif",
      id: 2,
    },
    {
      name: "Football",
      image: "/football.jpg",
      id: 3,
    },
    {
      name: "Cricket",
      image: "/cricket.jpg",
      id: 4,
    },
    {
      name: "Swimming",
      image: "/swimming.webp",
      id: 5,
    },
    {
      name: "Table Tennis",
      image: "/table_tennis.jpg",
      id: 6,
    },
  ];

  // Handle sports data safely - combine both approaches
  const popularSports =
    Array.isArray(sportsData) && sportsData.length > 0
      ? sportsData
          .filter((sport) => sport && sport.name) // Filter out sports without name
          .map((sport) => {
            return {
              name: sport.name,
              image: `/${sport.name.toLowerCase().replace(/\s+/g, "_")}.jpg`,
              id: sport.id || sport.name,
              description: getSportDescription(sport.name),
            };
          })
      : fallbackSports;

  const nextPage = () => {
    if (venues.length > 0) {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  };

  const prevPage = () => {
    if (venues.length > 0) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="QuickCourt – Book Sports Courts Near You"
        description="Find and book badminton, tennis, and turf courts near you. Compare venues, see availability, and reserve instantly with QuickCourt."
      />

      {/* User Dashboard Section - Only show if user is logged in */}
      {user && (
        <section className="py-8 px-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-gray-600">
                  Your personalized sports booking dashboard
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8">
              {/* Quick Stats */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Upcoming Bookings</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {bookingsLoading ? (
                          <Skeleton className="h-6 w-8" />
                        ) : (
                          upcomingBookings?.length || 0
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Trophy className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {bookingHistory?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Link to="/venues" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Find & Book Venues
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      View My Bookings
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : upcomingBookings && upcomingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingBookings.slice(0, 3).map((booking: Booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CalendarCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {booking.venue?.name ||
                                booking.court?.venue?.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(
                                booking.bookingDate
                              ).toLocaleDateString()}{" "}
                              at {booking.startTime}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                      {upcomingBookings.length > 3 && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Link to="/profile">
                            View all {upcomingBookings.length} bookings →
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 mb-2">No upcoming bookings</p>
                      <Button asChild size="sm">
                        <Link to="/venues">Book your first venue</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Left Column - Search Section */}
            <div>
              <Card className="bg-white border border-gray-300 shadow-sm">
                <CardContent className="p-6">
                  <div className="relative mb-6">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          value={searchCity}
                          onChange={(e) => {
                            setSearchCity(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder={
                            currentLocation
                              ? `Current: ${currentLocation}`
                              : "Enter city name"
                          }
                          className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                        />
                        {showSuggestions && filteredCities.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                            {currentLocation && (
                              <div
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-900 border-b border-gray-100"
                                onClick={() =>
                                  handleCitySelect(currentLocation)
                                }
                              >
                                <Navigation className="inline w-4 h-4 mr-2 text-green-500" />
                                {currentLocation} (Current Location)
                              </div>
                            )}
                            {filteredCities.map((city) => (
                              <div
                                key={city}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-900"
                                onClick={() => handleCitySelect(city)}
                              >
                                {city}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={detectCurrentLocation}
                        disabled={isDetectingLocation}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    asChild
                  >
                    <Link
                      to={`/venues?location=${encodeURIComponent(searchCity)}`}
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search Venues
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Hero Image */}
            <div>
              <Card className="bg-white border border-gray-300 shadow-sm overflow-hidden">
                <CardContent className="p-0 h-full">
                  <img
                    src={heroImage}
                    alt="QuickCourt - Sports venue booking"
                    className="w-full h-full object-cover flex-1"
                    style={{ display: "block" }}
                    onError={(e) => {
                      // Show fallback content if image fails to load
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-full h-full flex items-center justify-center min-h-[300px] bg-gradient-to-br from-green-100 to-blue-100";
                      fallback.innerHTML = `
                        <div class="text-center">
                          <div class="text-4xl text-green-600 mb-4">🏟️</div>
                          <span class="text-gray-600 text-lg font-medium">Sports Courts & Facilities</span>
                        </div>
                      `;
                      target.parentElement?.appendChild(fallback);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Smart Insights Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Smart Insights & Recommendations
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Real-time Availability */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900">
                      Live Availability
                    </h3>
                  </div>
                  <p className="text-green-700 text-sm mb-3">
                    {venuesData?.venues
                      ? `${
                          venuesData.venues.filter((v) => v.isApproved).length
                        } venues available now`
                      : "Checking availability..."}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">
                      Updated 2 minutes ago
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Sports Today */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900">
                      Trending Sports
                    </h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-3">
                    Most booked sports in your area
                  </p>
                  <div className="space-y-2">
                    {popularSports.slice(0, 3).map((sport, index) => (
                      <div key={sport.id} className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-blue-900">
                          {sport.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Book */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900">
                      Quick Actions
                    </h3>
                  </div>
                  <p className="text-purple-700 text-sm mb-3">
                    Fast track your booking experience
                  </p>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                      onClick={() => navigate("/venues?sportType=badminton")}
                    >
                      <span className="mr-2">🏸</span>
                      Book Badminton
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                      onClick={() => navigate("/venues?available=today")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Today's Slots
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Search Filters */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues?sortBy=rating")}
                  >
                    <Star className="h-4 w-4" />
                    Top Rated
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues?sortBy=price")}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Best Price
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues?venueType=indoor")}
                  >
                    <Shield className="h-4 w-4" />
                    Indoor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues?venueType=outdoor")}
                  >
                    <Navigation className="h-4 w-4" />
                    Outdoor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues?available=now")}
                  >
                    <Clock className="h-4 w-4" />
                    Available Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/venues")}
                  >
                    <ArrowRight className="h-4 w-4" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Venues Section */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Venues
              </h2>
              <Button
                variant="link"
                className="text-green-600 hover:text-green-700"
                asChild
              >
                <Link to="/venues">See all venues →</Link>
              </Button>
            </div>

            {/* Fallback Message for Index Page */}
            {venuesData?.fallbackMessage && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {venuesData.fallbackMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="relative">
              {venuesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading venues...</span>
                </div>
              ) : venuesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">
                    Failed to load venues. Please try again.
                  </p>
                </div>
              ) : currentVenues.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No venues found in your area.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentVenues.map((venue: Venue) => (
                    <Card
                      key={venue.id}
                      className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                      <CardContent className="p-0">
                        {/* Venue Image */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden relative">
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          
                          {/* Overlay gradient for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                          {/* Venue Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge
                              variant={
                                venue.isApproved ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {venue.isApproved ? "Available" : "Pending"}
                            </Badge>
                          </div>

                          {/* Rating Badge */}
                          {venue.rating &&
                            parseFloat(venue.rating.toString()) > 0 && (
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs font-medium">
                                  {parseFloat(venue.rating.toString()).toFixed(
                                    1
                                  )}
                                </span>
                              </div>
                            )}
                        </div>

                        {/* Venue Details */}
                        <div className="p-4">
                          <Link to={`/venue/${venue.id}`} className="block">
                            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {venue.name}
                            </h3>
                          </Link>

                          {/* Location */}
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm line-clamp-1">
                              {venue.location}
                            </span>
                          </div>

                          {/* Sports Available */}
                          {venue.available_sports &&
                            venue.available_sports.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {venue.available_sports
                                    .slice(0, 3)
                                    .map((sport) => (
                                      <Badge
                                        key={sport}
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                      >
                                        {getSportEmoji(sport)} {sport}
                                      </Badge>
                                    ))}
                                  {venue.available_sports.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-1"
                                    >
                                      +{venue.available_sports.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Venue Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {venue.courts_count || "Multiple"} courts
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {venue.totalReviews || 0} reviews
                              </span>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{venue.min_price || "N/A"}
                                </span>
                                {venue.min_price && (
                                  <span className="text-sm text-gray-500">
                                    /hr
                                  </span>
                                )}
                              </div>
                              {venue.min_price &&
                                venue.max_price &&
                                venue.min_price !== venue.max_price && (
                                  <span className="text-xs text-gray-500">
                                    up to ₹{venue.max_price}/hr
                                  </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/venue/${venue.id}`);
                                }}
                                className="text-xs"
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!user) {
                                    toast({
                                      title: "Login Required",
                                      description: "You must login first for booking venue",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  navigate(`/booking/${venue.id}`);
                                }}
                                className="text-xs"
                              >
                                Book
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button variant="outline" size="sm" onClick={prevPage}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={nextPage}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Popular Sports Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Popular Sports
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularSports.map((sport) => (
                <Link
                  key={sport.id}
                  to={`/venues?sportType=${encodeURIComponent(
                    sport.name.toLowerCase()
                  )}`}
                  className="group"
                >
                  <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                    <CardContent className="p-4 text-center">
                      <div className="aspect-square bg-gray-100 border border-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={sport.image}
                          alt={sport.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const nextElement = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = "flex";
                            }
                          }}
                        />
                        <div className="text-4xl text-gray-500">
                          {getSportEmoji(sport.name)}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors text-sm">
                        {sport.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-gray-300 mb-8"></div>
        </div>
      </section>
    </div>
  );
};

export default Index;
