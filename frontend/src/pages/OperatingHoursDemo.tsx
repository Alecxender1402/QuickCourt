import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OperatingHoursManagement from '../components/owner/OperatingHoursManagement';
import FlexibleBookingForm from '../components/booking/FlexibleBookingForm';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Clock, Calendar, Users, Building2 } from 'lucide-react';

interface Venue {
  id: number;
  name: string;
  location: string;
  courts: Array<{
    id: number;
    name: string;
    sportType: string;
    pricePerHour: number;
    isActive: boolean;
  }>;
}

const OperatingHoursDemo = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId]);

  const fetchVenueDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/public/venues/${venueId}`);
      if (response.ok) {
        const data = await response.json();
        setVenue(data.venue);
      }
    } catch (error) {
      console.error('Failed to fetch venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading venue details...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="text-center p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Venue Not Found</h2>
              <p className="text-gray-600">The requested venue could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === 'facility_owner';
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {venue.name}
            </CardTitle>
            <p className="text-gray-600">{venue.location}</p>
          </CardHeader>
        </Card>

        {/* New Operating Hours System Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              New Operating Hours System
            </CardTitle>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>✅ Fixed:</strong> Complex individual time slot management system has been replaced with a simple operating hours approach.</p>
              <p><strong>🎯 How it works:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Facility providers set daily operating hours (e.g., 9 AM - 10 PM)</li>
                <li>Users can book any time range within those hours</li>
                <li>System prevents double-booking automatically</li>
                <li>Much simpler and more intuitive user experience</li>
              </ul>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue={canManage ? "manage" : "book"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {canManage && (
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Manage Operating Hours
              </TabsTrigger>
            )}
            <TabsTrigger value="book" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {canManage ? 'Test Booking System' : 'Book Court'}
            </TabsTrigger>
          </TabsList>

          {canManage && (
            <TabsContent value="manage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Facility Owner Dashboard
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Set your venue's operating hours for each day of the week. Users can only book within these hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <OperatingHoursManagement venueId={venue.id} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="book" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {canManage ? 'Customer Booking Experience' : 'Book a Court'}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {canManage 
                    ? 'This is how customers will experience the new flexible booking system.'
                    : 'Select your preferred court, date, and time range within operating hours.'
                  }
                </p>
              </CardHeader>
              <CardContent>
                <FlexibleBookingForm venue={venue} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ System Fixed - Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">For Facility Owners:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Simple daily operating hours setup</li>
                  <li>• No complex individual slot management</li>
                  <li>• View all bookings in a clean calendar view</li>
                  <li>• Automatic conflict prevention</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">For Customers:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Book any time range they want</li>
                  <li>• No fixed slot restrictions</li>
                  <li>• See existing bookings to avoid conflicts</li>
                  <li>• Intuitive booking experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperatingHoursDemo;
