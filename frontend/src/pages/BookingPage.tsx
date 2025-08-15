import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Star, 
  Clock, 
  Calendar,
  Minus,
  Plus,
  ChevronLeft
} from "lucide-react";
import { useVenueDetails } from "@/services/venueService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BookingPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for booking form
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedDate, setSelectedDate] = useState("2025-05-06");
  const [startTime, setStartTime] = useState("01:00 PM");
  const [duration, setDuration] = useState(2);
  const [selectedCourt, setSelectedCourt] = useState("");
  
  // API call
  const { data: venue, isLoading, error } = useVenueDetails(parseInt(venueId || "0"));

  const handleDurationChange = (increment: boolean) => {
    if (increment) {
      setDuration(prev => prev + 1);
    } else if (duration > 1) {
      setDuration(prev => prev - 1);
    }
  };

  const calculateTotalPrice = () => {
    // Base price calculation - you'd get this from your pricing API
    const basePrice = selectedSport === "badminton" ? 500 : 
                     selectedSport === "table tennis" ? 300 :
                     selectedSport === "box cricket" ? 800 : 500;
    return basePrice * duration;
  };

  const handleContinueToPayment = () => {
    if (!selectedSport || !selectedDate || !startTime || !selectedCourt) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically save the booking details and proceed to payment
    toast({
      title: "Redirecting to Payment",
      description: "Processing your booking details..."
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load venue details</p>
          <Link to="/venues">
            <Button variant="outline">Back to Venues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO 
        title={`Book ${venue.name} - QuickCourt`} 
        description={`Book courts at ${venue.name}. Select your preferred sport, date, and time.`} 
      />
      
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">QUICKCOURT</h1>
              <span className="text-gray-400">Proud Elephant</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Book
              </Button>
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded">
                <span className="text-sm">Mitchell Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link 
            to={`/venue/${venueId}`}
            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Venue Details
          </Link>
          <h1 className="text-3xl font-bold mb-2">Court Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="space-y-6">
            {/* Venue Info */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-2">{venue.name}</h2>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{venue.rating} ({venue.totalReviews || 0})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6 space-y-6">
                {/* Sport Selection */}
                <div>
                  <Label className="text-white mb-2 block">Sport</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {venue.available_sports?.map((sport) => (
                        <SelectItem key={sport} value={sport.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <span>
                              {sport.toLowerCase() === 'badminton' ? '🏸' :
                               sport.toLowerCase() === 'tennis' ? '🎾' :
                               sport.toLowerCase() === 'football' ? '⚽' :
                               sport.toLowerCase().includes('cricket') ? '🏏' :
                               sport.toLowerCase() === 'swimming' ? '🏊' :
                               sport.toLowerCase() === 'table tennis' ? '🏓' : '🏟️'}
                            </span>
                            <span className="capitalize">{sport}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div>
                  <Label className="text-white mb-2 block">Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                  <div className="mt-2 text-sm text-blue-400">Blue Squid</div>
                </div>

                {/* Start Time */}
                <div>
                  <Label className="text-white mb-2 block">Start Time</Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Clock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-white mb-2 block">Duration</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDurationChange(false)}
                      disabled={duration <= 1}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-4 py-2 bg-gray-800 rounded border border-gray-600 text-center min-w-16">
                      {duration} Hr
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDurationChange(true)}
                      className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Court Selection */}
                <div>
                  <Label className="text-white mb-2 block">Court</Label>
                  <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="--Select Court--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table1">Table 1</SelectItem>
                      <SelectItem value="table2">Table 2</SelectItem>
                      <SelectItem value="court1">Court 1</SelectItem>
                      <SelectItem value="court2">Court 2</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Available Tables/Courts */}
                  <div className="mt-3 flex gap-2">
                    <Badge 
                      variant="outline" 
                      className="bg-gray-800 border-gray-600 text-white cursor-pointer hover:bg-gray-700"
                      onClick={() => setSelectedCourt("table1")}
                    >
                      Table 1 ✕
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="bg-gray-800 border-gray-600 text-white cursor-pointer hover:bg-gray-700"
                      onClick={() => setSelectedCourt("table2")}
                    >
                      Table 2 ✕
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-sm text-purple-400">Zealous Spoonbill</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sport:</span>
                    <span className="text-white capitalize">{selectedSport || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{duration} hour(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Court:</span>
                    <span className="text-white">{selectedCourt || "Not selected"}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">₹{calculateTotalPrice()}.00</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  onClick={handleContinueToPayment}
                >
                  Continue to Payment - ₹{calculateTotalPrice()}.00
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
