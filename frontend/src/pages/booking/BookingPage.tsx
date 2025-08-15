import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, MapPin, CreditCard, ArrowLeft } from "lucide-react";

const BookingPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [playerCount, setPlayerCount] = useState('2');

  // Mock data - in real app this would come from API
  const venue = {
    name: "Elite Sports Complex",
    location: "Sector 18, Noida",
    rating: 4.8,
    sports: [
      { name: 'Badminton', price: 800, courts: ['Court A', 'Court B', 'Court C'] },
      { name: 'Tennis', price: 1200, courts: ['Court 1', 'Court 2'] },
      { name: 'Basketball', price: 1000, courts: ['Full Court', 'Half Court'] },
      { name: 'Table Tennis', price: 400, courts: ['Table 1', 'Table 2', 'Table 3'] }
    ]
  };

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const selectedSportData = venue.sports.find(sport => sport.name === selectedSport);
  const basePrice = selectedSportData?.price || 0;
  const totalPrice = basePrice * parseInt(duration);

  const handleBooking = () => {
    if (!selectedSport || !selectedDate || !selectedTime || !selectedCourt) {
      alert('Please fill all required fields');
      return;
    }
    
    // In real app, this would make API call
    alert('Booking successful! Redirecting to payment...');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/venue/${venueId}`)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Venue
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{venue.location}</span>
                <Badge variant="secondary" className="ml-2">★ {venue.rating}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sport Selection */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Sport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedSport}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Choose a sport" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {venue.sports.map((sport) => (
                      <SelectItem 
                        key={sport.name} 
                        value={sport.name}
                        className="text-white hover:bg-gray-600"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{sport.name}</span>
                          <span className="text-green-400">₹{sport.price}/hr</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Duration (hours)</Label>
                    <Select onValueChange={setDuration} defaultValue="1">
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="1" className="text-white hover:bg-gray-600">1 hour</SelectItem>
                        <SelectItem value="2" className="text-white hover:bg-gray-600">2 hours</SelectItem>
                        <SelectItem value="3" className="text-white hover:bg-gray-600">3 hours</SelectItem>
                        <SelectItem value="4" className="text-white hover:bg-gray-600">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Available Time Slots
                  </Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={selectedTime === time 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        }
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Court Selection */}
            {selectedSport && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Select Court
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Available Courts</Label>
                      <Select onValueChange={setSelectedCourt}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose a court" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {selectedSportData?.courts.map((court) => (
                            <SelectItem 
                              key={court} 
                              value={court}
                              className="text-white hover:bg-gray-600"
                            >
                              {court}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Number of Players</Label>
                      <Select onValueChange={setPlayerCount} defaultValue="2">
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="1" className="text-white hover:bg-gray-600">1 Player</SelectItem>
                          <SelectItem value="2" className="text-white hover:bg-gray-600">2 Players</SelectItem>
                          <SelectItem value="4" className="text-white hover:bg-gray-600">4 Players</SelectItem>
                          <SelectItem value="6" className="text-white hover:bg-gray-600">6 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Venue:</span>
                    <span className="text-white">{venue.name}</span>
                  </div>
                  {selectedSport && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sport:</span>
                      <span className="text-white">{selectedSport}</span>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white">{selectedTime} - {String(parseInt(selectedTime.split(':')[0]) + parseInt(duration)).padStart(2, '0')}:00</span>
                    </div>
                  )}
                  {selectedCourt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Court:</span>
                      <span className="text-white">{selectedCourt}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{duration} hour{duration !== '1' ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-white">{playerCount}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="space-y-2">
                    {selectedSport && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Base price ({duration}h):</span>
                        <span className="text-white">₹{totalPrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Platform fee:</span>
                      <span className="text-white">₹49</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">₹{totalPrice + 49}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleBooking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={!selectedSport || !selectedDate || !selectedTime || !selectedCourt}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </Button>
                
                <p className="text-xs text-gray-400 text-center">
                  By booking, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
