import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar, Clock, MapPin, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentModal } from '../stripe/PaymentModal';

interface Court {
  id: number;
  name: string;
  sportType: string;
  pricePerHour: number;
  isActive: boolean;
}

interface Venue {
  id: number;
  name: string;
  location: string;
  courts: Court[];
}

interface ExistingBooking {
  startTime: string;
  endTime: string;
  bookedBy: string;
}

interface FlexibleBookingFormProps {
  venue: Venue;
}

const FlexibleBookingForm: React.FC<FlexibleBookingFormProps> = ({ venue }) => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (bookingDate && selectedCourt) {
      fetchExistingBookings();
    }
  }, [bookingDate, selectedCourt]);

  useEffect(() => {
    if (selectedCourt && bookingDate && startTime && endTime) {
      checkAvailability();
    }
  }, [selectedCourt, bookingDate, startTime, endTime]);

  const fetchExistingBookings = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/flexible-booking/court/${selectedCourt?.id}/bookings?date=${bookingDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setExistingBookings(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch existing bookings:', error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedCourt || !bookingDate || !startTime || !endTime) return;

    setChecking(true);
    try {
      const response = await fetch('http://localhost:3000/api/flexible-booking/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venueId: venue.id,
          courtId: selectedCourt.id,
          bookingDate: bookingDate,
          startTime: startTime,
          endTime: endTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.data);
      } else {
        const errorData = await response.json();
        setAvailability({ isAvailable: false, error: errorData.message });
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
      setAvailability({ isAvailable: false, error: 'Failed to check availability' });
    } finally {
      setChecking(false);
    }
  };

  const validateBooking = () => {
    if (!selectedCourt) {
      toast({
        title: "Validation Error",
        description: "Please select a court",
        variant: "destructive"
      });
      return false;
    }

    if (!bookingDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return false;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Validation Error",
        description: "Please select start and end times",
        variant: "destructive"
      });
      return false;
    }

    // Validate date is not in the past
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot book for past dates",
        variant: "destructive"
      });
      return false;
    }

    // If booking is for today, validate start time is not in the past
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startTimeMinutes = startHour * 60 + startMinute;

      if (startTimeMinutes <= currentTimeMinutes) {
        const currentTimeFormatted = `${Math.floor(currentTimeMinutes/60)}:${(currentTimeMinutes%60).toString().padStart(2,'0')}`;
        toast({
          title: "Invalid Time",
          description: `Cannot book for past or current times. Current time is ${currentTimeFormatted}. Please select a future time slot.`,
          variant: "destructive"
        });
        return false;
      }
    }

    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);

    if (start >= end) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive"
      });
      return false;
    }

    if (!availability?.isAvailable) {
      toast({
        title: "Booking Conflict",
        description: "Selected time conflicts with existing bookings",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBooking()) return;

    // Calculate total amount
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const amount = durationHours * (selectedCourt?.pricePerHour || 0);
    
    setCalculatedAmount(amount);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (result: any) => {
    setShowPaymentModal(false);
    toast({
      title: "Success",
      description: `Booking created successfully! Total: ₹${calculatedAmount.toFixed(2)}`
    });
    
    // Reset form
    setSelectedCourt(null);
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setNotes('');
    setAvailability(null);
    
    // Refresh existing bookings
    fetchExistingBookings();
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentModal(false);
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  const activeCourts = venue.courts.filter(court => court.isActive);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Flexible Booking at {venue.name}
        </CardTitle>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {venue.location}
        </p>
        <p className="text-sm text-blue-600 font-medium">
          ⚡ Select ANY start and end time - Pay only for the hours you use!
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Court Selection */}
          <div className="space-y-2">
            <Label htmlFor="court">Select Court</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeCourts.map((court) => (
                <div
                  key={court.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCourt?.id === court.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCourt(court)}
                >
                  <div className="font-medium text-lg">{court.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{court.sportType}</div>
                  <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {court.pricePerHour}/hour
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Select Date</Label>
            <Input
              id="date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="max-w-xs"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Availability Check */}
          {checking && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking availability...</span>
            </div>
          )}

          {availability && !checking && (
            <div className={`p-4 rounded-lg ${availability.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center gap-2 mb-2">
                {availability.isAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${availability.isAvailable ? 'text-green-800' : 'text-red-800'}`}>
                  {availability.isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
              
              {availability.isAvailable && (
                <div className="space-y-1 text-sm text-green-700">
                  <div>Duration: <span className="font-medium">{availability.duration}</span></div>
                  <div>Rate: <span className="font-medium">${availability.pricePerHour}/hour</span></div>
                  <div className="text-lg font-bold text-green-800">
                    Total Cost: ${Number(availability.totalAmount || 0).toFixed(2)}
                  </div>
                </div>
              )}

              {availability.error && (
                <div className="text-sm text-red-700">{availability.error}</div>
              )}
            </div>
          )}

          {/* Existing Bookings Display */}
          {existingBookings.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Bookings for Selected Date</Label>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                {existingBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                    <span className="font-medium">
                      {booking.startTime} - {booking.endTime}
                    </span>
                    <span className="text-gray-600">by {booking.bookedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={!availability?.isAvailable}
            className="w-full flex items-center gap-2 text-lg py-6"
          >
            <DollarSign className="h-5 w-5" />
            {availability?.isAvailable ? `Proceed to Payment - ₹${Number(availability.totalAmount || 0).toFixed(2)}` : 'Check Availability First'}
          </Button>
        </form>
      </CardContent>
      
      {showPaymentModal && selectedCourt && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={calculatedAmount}
          bookingData={{
            venueId: parseInt(venue.id.toString()),
            courtId: parseInt(selectedCourt.id.toString()),
            date: bookingDate,
            startTime: startTime,
            endTime: endTime,
            notes: notes || '',
          }}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </Card>
  );
};

export default FlexibleBookingForm;
