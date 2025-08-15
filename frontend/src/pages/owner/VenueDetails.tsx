import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Clock, 
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";
import { useVenueDetails } from "@/services/venueService";
import { Venue } from "@/lib/types";

const VenueDetails = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const { data: venue, isLoading, error } = useVenueDetails(Number(venueId));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % venue.photos.length);
    }
  };

  const prevImage = () => {
    if (venue?.photos && venue.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + venue.photos.length) % venue.photos.length);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <SEO title="Venue Details – QuickCourt" description="View venue details and manage courts." />
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/owner/venues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venues
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="container py-10">
        <SEO title="Venue Details – QuickCourt" description="View venue details and manage courts." />
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/owner/venues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venues
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load venue details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (venue.isApproved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
  };

  return (
    <div className="container py-10 max-w-6xl">
      <SEO title={`${venue.name} – QuickCourt`} description={`Manage ${venue.name} and its courts.`} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/owner/venues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venues
          </Button>
          <div>
            <PageHeader title={venue.name} />
            <div className="flex items-center space-x-3 mt-2">
              {getStatusBadge()}
              <span className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {venue.location}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link to={`/owner/venues/${venueId}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Venue
            </Button>
          </Link>
          <Link to={`/owner/venues/${venueId}/bookings`}>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              View Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* Image Gallery Section */}
      {venue.photos && venue.photos.length > 0 && (
        <div className="mb-8">
          <div className="relative h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={venue.photos[currentImageIndex]}
              alt={`${venue.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {venue.photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
                  <span className="text-white text-sm">
                    {currentImageIndex + 1} / {venue.photos.length}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {venue.photos.length > 1 && (
            <div className="flex justify-center mt-4 space-x-2 overflow-x-auto pb-2">
              {venue.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-primary'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`${venue.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!venue.photos || venue.photos.length === 0 && (
        <div className="mb-8">
          <div className="h-64 md:h-80 lg:h-96 rounded-lg bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No images available</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Venue Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{venue.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                <p className="text-gray-600 flex items-start">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {venue.address}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Phone</h4>
                  <p className="text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {venue.contactPhone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Email</h4>
                  <p className="text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {venue.contactEmail || 'Not provided'}
                  </p>
                </div>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Courts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Courts ({venue.courts?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {venue.courts && venue.courts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {venue.courts.map((court) => (
                    <Card key={court.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{court.name}</h4>
                          <Badge variant="outline">{court.sportType}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <IndianRupee className="w-3 h-3 mr-1" />
                            ₹{court.pricePerHour}/hour
                          </div>
                          
                          {court.capacity && (
                            <div className="flex items-center text-gray-600">
                              <Users className="w-3 h-3 mr-1" />
                              Max {court.capacity} players
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {court.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No courts added yet.</p>
                  <Button variant="outline" className="mt-3" asChild>
                    <Link to={`/owner/venues/${venueId}/edit`}>
                      Add Your First Court
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="font-medium">{venue.rating}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Reviews</span>
                <span className="font-medium">{venue.totalReviews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Courts</span>
                <span className="font-medium">{venue.courts?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium">
                  {venue.isApproved ? 'Active' : 'Pending'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={`/owner/venues/${venueId}/bookings`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Bookings
                </Button>
              </Link>
              <Link to={`/owner/venues/${venueId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </Link>
              <Link to={`/owner/courts?venueId=${venueId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Courts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
