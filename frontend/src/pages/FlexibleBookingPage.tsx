import React from 'react';
import FlexibleBookingForm from '../components/booking/FlexibleBookingFormNew';

// Example page to demonstrate the flexible booking form
const FlexibleBookingPage: React.FC = () => {
  // Example venue data - in a real app, this would come from your API
  const venue = {
    id: 1,
    name: "Sports Arena",
    location: "123 Main Street, City",
    courts: [
      {
        id: 1,
        name: "Tennis Court 1",
        sportType: "Tennis",
        pricePerHour: 25,
        isActive: true
      },
      {
        id: 2,
        name: "Basketball Court 1",
        sportType: "Basketball", 
        pricePerHour: 30,
        isActive: true
      },
      {
        id: 3,
        name: "Badminton Court 1",
        sportType: "Badminton",
        pricePerHour: 20,
        isActive: true
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book Your Court - Flexible Timing
          </h1>
          <p className="text-gray-600">
            Choose your preferred start and end time. Pay only for the duration you use!
          </p>
        </div>
        
        <FlexibleBookingForm venue={venue} />
        
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">How Flexible Booking Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-medium mb-1">Choose Any Time</h3>
                <p className="text-gray-600">Select any start and end time that works for you</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-medium mb-1">Pay Per Hour</h3>
                <p className="text-gray-600">Only pay for the exact duration you book</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-medium mb-1">Instant Confirmation</h3>
                <p className="text-gray-600">Get immediate booking confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleBookingPage;
