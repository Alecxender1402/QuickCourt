import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2, Home, Calendar } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

// Utility function to safely format time to 12-hour format
const formatTime = (timeString: string): string => {
  try {
    // Handle HH:MM format time strings (from backend)
    if (timeString.includes(':') && !timeString.includes('T')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const today = new Date();
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      
      return timeDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Handle ISO date strings (fallback)
    if (timeString.includes('T') || timeString.includes('-')) {
      const dateObj = new Date(timeString);
      const hours = dateObj.getUTCHours();
      const minutes = dateObj.getUTCMinutes();
      const today = new Date();
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      
      return timeDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return timeString; // Fallback to original string
  } catch (error) {
    console.warn('Error formatting time:', timeString, error);
    return timeString; // Fallback to original string
  }
};

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      handlePaymentSuccess(sessionId);
    } else {
      toast({
        title: "Error",
        description: "No session ID found",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/payments/checkout-success?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBookingData(data.booking);
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed",
        });
      } else {
        throw new Error(data.message || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Error",
        description: "Failed to confirm your booking. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Processing your payment...</p>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we confirm your booking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600">
            Your court booking has been confirmed
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {bookingData ? (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Booking ID:</span>
                  <p>#{bookingData.id || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Amount Paid:</span>
                  <p>₹{Number(bookingData.totalAmount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <p>{bookingData.bookingDate ? new Date(bookingData.bookingDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Time:</span>
                  <p>
                    {bookingData.startTime && bookingData.endTime 
                      ? `${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Status:</span>
                  <p className="text-green-600 capitalize">{bookingData.status || 'Confirmed'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-center text-gray-600">Loading booking details...</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/profile')}
              className="flex-1 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              View My Bookings
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>A confirmation email has been sent to your registered email address.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSuccess;
