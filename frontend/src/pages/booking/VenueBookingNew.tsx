import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlexibleBookingForm from "@/components/booking/FlexibleBookingForm";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Zap,
  Grid3X3,
} from "lucide-react";
import { useVenueDetails } from "@/services/venueService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VenueBooking = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // API calls
  const {
    data: venue,
    isLoading: venueLoading,
    error: venueError,
  } = useVenueDetails(parseInt(venueId || "0"));

  const handleCourtSelection = (courtId: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to make a booking",
        variant: "destructive",
      });
      return;
    }

    navigate(`/booking/court?venueId=${venueId}&courtId=${courtId}`);
  };

  if (venueLoading) {
    return (
      <div className="container py-10">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (venueError || !venue) {
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

  return (
    <div className="container py-10">
      <SEO
        title={`Book ${venue.name} – QuickCourt`}
        description={`Select a court and book your session at ${venue.name}`}
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
          title="Book Your Court"
          subtitle={`Choose your preferred booking method at ${venue.name}`}
        />
      </div>

      {/* Venue Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                {venue.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{venue.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{venue.rating}</span>
                    <span>({venue.totalReviews || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Options */}
      <Tabs defaultValue="flexible" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flexible" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Flexible Booking
          </TabsTrigger>
          <TabsTrigger value="traditional" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Traditional Slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flexible" className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Flexible Booking:</strong> Choose ANY start and end time. Pay only for the duration you use!
            </AlertDescription>
          </Alert>
          <FlexibleBookingForm venue={venue} />
        </TabsContent>

        <TabsContent value="traditional" className="space-y-6">
          <Alert>
            <Grid3X3 className="h-4 w-4" />
            <AlertDescription>
              <strong>Traditional Booking:</strong> Select from pre-defined time slots.
            </AlertDescription>
          </Alert>
          
          {/* Courts Section */}
          {venue.courts && venue.courts.length > 0 ? (
            <div className="space-y-6">
              <div className="grid gap-6">
                {venue.courts.map((court) => (
                  <Card
                    key={court.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCourtSelection(court.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {court.name?.charAt(0) ||
                              court.sportType?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {court.name || `${court.sportType} Court`}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <Badge variant="secondary">{court.sportType}</Badge>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>Max {court.maxPlayers || 4} players</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${court.pricePerHour}
                            <span className="text-sm font-normal text-muted-foreground">
                              /hour
                            </span>
                          </div>
                          <Button size="sm" className="mt-2" disabled={!court.isActive}>
                            Select Court
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No courts are currently available at this venue.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Booking Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operating Hours:</span>
              <span>7:00 AM - 11:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Booking:</span>
              <span>Up to 30 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancellation:</span>
              <span>Free up to 2 hours before</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span>{venue.contactPhone || venue.contactEmail}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueBooking;
