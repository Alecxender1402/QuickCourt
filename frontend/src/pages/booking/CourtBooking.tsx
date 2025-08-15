import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import FlexibleBookingFormNew from "@/components/booking/FlexibleBookingFormNew";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import {
  useVenueDetails,
} from "@/services/venueService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Users,
  AlertTriangle,
  Loader2,
  Zap,
} from "lucide-react";

const CourtBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // URL parameters from search params
  const venueId = searchParams.get("venueId");
  const courtId = searchParams.get("courtId");

  // Parse and validate IDs
  const venueIdNum = venueId ? parseInt(venueId) : null;
  const courtIdNum = courtId ? parseInt(courtId) : null;

  // API calls
  const {
    data: venue,
    isLoading: venueLoading,
    error: venueError,
  } = useVenueDetails(venueIdNum || 0);

  // Get the selected court from venue data
  const selectedCourt = venue?.courts?.find((c) => c.id === courtIdNum);

  // Validation
  useEffect(() => {
    if (!venueId || !courtId) {
      toast({
        title: "Invalid Request",
        description: "Venue ID and Court ID are required for booking",
        variant: "destructive",
      });
    }
  }, [venueId, courtId, toast]);

  // Early validation for required parameters
  if (!venueId || !courtId || !venueIdNum || !courtIdNum) {
    return (
      <div className="container py-10">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Invalid Parameters</h2>
          <p className="text-muted-foreground mb-4">
            Valid venue ID and court ID are required for booking.
          </p>
          <Button asChild>
            <Link to="/venues">← Back to Venues</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (venueLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading venue details...</span>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container py-10">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Venue Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load venue details.
          </p>
          <Button asChild>
            <Link to="/venues">← Back to Venues</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!courtId || !selectedCourt) {
    return (
      <div className="container py-10">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Court Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The selected court is not available or doesn't exist.
          </p>
          <Button asChild>
            <Link to={`/venues/${venueId}`}>← Back to Venue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <SEO
        title="Book Court – QuickCourt"
        description="Select court, date, and time slot to book your session."
      />

      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/venues/${venueId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {venue.name}
        </Link>
        <PageHeader
          title={`Book ${
            selectedCourt.name || `${selectedCourt.sportType} Court`
          }`}
          subtitle={`${venue.name} • ${venue.location}`}
        />

        {/* Court Info Card */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {selectedCourt.name?.charAt(0) ||
                    selectedCourt.sportType?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {selectedCourt.name || `${selectedCourt.sportType} Court`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {selectedCourt.sportType}
                    </Badge>
                    <span>•</span>
                    <span className="font-medium text-green-600">
                      ₹{selectedCourt.pricePerHour}/hr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flexible Booking Only */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Flexible Booking:</strong> Choose ANY start and end time. Pay only for the duration you use!
            </AlertDescription>
          </Alert>
          
          {/* Create a venue object for FlexibleBookingForm with only the selected court */}
          <FlexibleBookingFormNew 
            venue={{
              ...venue,
              courts: [selectedCourt]
            }} 
          />
        </div>

        {/* Booking Summary Sidebar */}
        <aside>
          <Card className="surface-card sticky top-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue:</span>
                  <span className="font-medium">{venue.name}</span>
                </div>
                {selectedCourt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court:</span>
                    <span className="font-medium">
                      {selectedCourt.name || selectedCourt.sportType + " Court"}
                    </span>
                  </div>
                )}
              </div>

              {!user && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need to login to make a booking.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default CourtBooking;
