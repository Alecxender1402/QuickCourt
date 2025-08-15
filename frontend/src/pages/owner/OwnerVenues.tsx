import React from 'react';
import { Link } from 'react-router-dom';
import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, MapPin, Users, Edit, Eye, Calendar, Phone, Mail, Image as ImageIcon } from "lucide-react";
import { useMyVenues } from "@/services/venueService";
import { Venue } from "@/lib/types";

const OwnerVenues = () => {
  const { data: venues, isLoading, error } = useMyVenues();

  if (isLoading) {
    return (
      <div className="container py-10">
        <SEO title="My Venues – QuickCourt" description="Manage your venues and courts." />
        <PageHeader title="My Venues" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <SEO title="My Venues – QuickCourt" description="Manage your venues and courts." />
        <PageHeader title="My Venues" />
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load your venues. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <SEO title="My Venues – QuickCourt" description="Manage your venues and courts." />
      
      <div className="flex justify-between items-center mb-8">
        <PageHeader title="My Venues" />
        <Button asChild>
          <Link to="/owner/venues/create">
            <Plus className="w-4 h-4 mr-2" />
            Add New Venue
          </Link>
        </Button>
      </div>

      {!venues || venues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No venues yet</h3>
            <p className="text-gray-600 mb-6">
              Start by creating your first venue to manage bookings and courts.
            </p>
            <Button asChild>
              <Link to="/owner/venues/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Venue
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue: Venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
};

interface VenueCardProps {
  venue: Venue;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {venue.photos && venue.photos.length > 0 ? (
          <img
            src={venue.photos[0]}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">No image</span>
            </div>
          </div>
        )}
        
        {/* Badge overlay */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={venue.isApproved ? "default" : "secondary"}
            className={venue.isApproved ? "bg-green-100 text-green-800" : "bg-white text-gray-800"}
          >
            {venue.isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
        
        {/* Images count overlay */}
        {venue.photos && venue.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
            +{venue.photos.length - 1} more
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{venue.name}</CardTitle>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{venue.location}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 text-sm mb-4 overflow-hidden" style={{ 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical' 
        }}>
          {venue.description}
        </p>

        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
          {venue.address && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{venue.address}</span>
            </div>
          )}
          {venue.contactPhone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>{venue.contactPhone}</span>
            </div>
          )}
          {venue.contactEmail && (
            <div className="flex items-center text-gray-600">
              <Mail className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{venue.contactEmail}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{venue.courts_count || 0} courts</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">★ {venue.rating.toFixed(1)}</span>
            <span className="ml-1">({venue.totalReviews})</span>
          </div>
        </div>

        {venue.available_sports && venue.available_sports.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Sports Available:</div>
            <div className="flex flex-wrap gap-1">
              {venue.available_sports.slice(0, 3).map((sport, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {sport}
                </Badge>
              ))}
              {venue.available_sports.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{venue.available_sports.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/owner/venues/${venue.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/owner/venues/${venue.id}/edit`}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/owner/venues/${venue.id}/bookings`}>
              <Calendar className="w-4 h-4 mr-1" />
              Bookings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerVenues;
