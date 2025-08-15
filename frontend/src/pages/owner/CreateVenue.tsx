import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/ui/ImageUpload";
import { Plus, Trash2, MapPin, Star, Clock, Users, Camera } from "lucide-react";
import { useCreateVenueWithImages } from "@/services/venueService";
import { useToast } from "@/hooks/use-toast";

interface CourtData {
  id: string;
  name: string;
  sportType: string;
  pricePerHour: number;
  operatingHours: {
    start: string;
    end: string;
  };
  maxPlayers: number;
}

interface VenueFormData {
  name: string;
  description: string;
  address: string;
  location: string;
  contactPhone: string;
  contactEmail: string;
  amenities: string[];
  courts: CourtData[];
  images: File[];
}

const AVAILABLE_SPORTS = [
  'Badminton',
  'Tennis',
  'Football',
  'Cricket',
  'Basketball',
  'Table Tennis',
  'Swimming',
  'Squash',
  'Volleyball',
  'Hockey'
];

const AVAILABLE_AMENITIES = [
  'Parking',
  'Restrooms',
  'Changing Rooms',
  'Cafeteria',
  'First Aid',
  'Equipment Rental',
  'Lockers',
  'Shower',
  'WiFi',
  'Air Conditioning',
  'Water Cooler',
  'CCTV Security'
];

const CreateVenue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createVenueMutation = useCreateVenueWithImages();

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    address: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    amenities: [],
    courts: [],
    images: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateCourtId = () => {
    return `court_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addCourt = () => {
    const newCourt: CourtData = {
      id: generateCourtId(),
      name: `Court ${formData.courts.length + 1}`,
      sportType: '',
      pricePerHour: 0,
      operatingHours: {
        start: '06:00',
        end: '22:00'
      },
      maxPlayers: 2
    };
    setFormData(prev => ({
      ...prev,
      courts: [...prev.courts, newCourt]
    }));
  };

  const updateCourt = (courtId: string, updates: Partial<CourtData>) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.map(court => 
        court.id === courtId ? { ...court, ...updates } : court
      )
    }));
  };

  const removeCourt = (courtId: string) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.filter(court => court.id !== courtId)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Venue name must be at least 3 characters';
    }

    if (formData.description.trim() && formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\d{10}$/.test(formData.contactPhone.replace(/\D/g, ''))) {
      newErrors.contactPhone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (formData.images.length < 2) {
      newErrors.images = 'Please upload at least 2 images of your venue';
    } else if (formData.images.length > 5) {
      newErrors.images = 'Maximum 5 images allowed';
    }

    if (formData.courts.length === 0) {
      newErrors.courts = 'At least one court is required';
    } else {
      formData.courts.forEach((court, index) => {
        if (!court.name.trim()) {
          newErrors[`court_${index}_name`] = 'Court name is required';
        }
        if (!court.sportType) {
          newErrors[`court_${index}_sport`] = 'Sport type is required';
        }
        if (!court.pricePerHour || court.pricePerHour <= 0) {
          newErrors[`court_${index}_price`] = 'Price per hour must be greater than 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create FormData for multipart upload
      const submitFormData = new FormData();
      
      // Add venue basic data
      submitFormData.append('name', formData.name);
      submitFormData.append('description', formData.description);
      submitFormData.append('address', formData.address);
      submitFormData.append('location', formData.location);
      submitFormData.append('contactPhone', formData.contactPhone);
      submitFormData.append('contactEmail', formData.contactEmail);
      submitFormData.append('amenities', JSON.stringify(formData.amenities));
      submitFormData.append('courts', JSON.stringify(formData.courts.map(court => ({
        name: court.name,
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        operatingHours: court.operatingHours,
        maxPlayers: court.maxPlayers
      }))));

      // Add venue images
      formData.images.forEach((image, index) => {
        submitFormData.append('venueImages', image);
      });

      await createVenueMutation.mutateAsync(submitFormData);
      
      toast({
        title: "Success!",
        description: "Venue created successfully. It will be reviewed by our team."
      });
      
      navigate('/owner/venues');
    } catch (error) {
      console.error('Create venue error:', error);
      toast({
        title: "Error",
        description: "Failed to create venue. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-10 max-w-4xl">
      <SEO title="Create Venue – QuickCourt" description="Create a new venue and manage courts." />
      
      <div className="mb-8">
        <PageHeader title="Create New Venue" />
        <p className="text-gray-600 mt-2">
          Add your venue details and courts. Your venue will be reviewed by our team before going live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Venue Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Venue Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter venue name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="City, Area (e.g., Bangalore, Koramangala)"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your venue, facilities, and what makes it special"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? "border-red-500" : ""}
                rows={4}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address with landmark"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className={errors.address ? "border-red-500" : ""}
                rows={2}
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  placeholder="Enter contact phone number"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className={errors.contactPhone ? "border-red-500" : ""}
                />
                {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Enter contact email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className={errors.contactEmail ? "border-red-500" : ""}
                />
                {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Venue Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Venue Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={formData.images}
              onChange={(images) => setFormData(prev => ({ ...prev, images }))}
              maxImages={5}
              required={true}
              label="Upload Venue Images"
              description="Upload 2-5 high-quality images that showcase your venue and facilities"
              error={errors.images}
            />
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <p className="text-sm text-gray-600">Select the amenities available at your venue</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_AMENITIES.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Courts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Courts *
              </span>
              <Button type="button" variant="outline" onClick={addCourt}>
                <Plus className="w-4 h-4 mr-2" />
                Add Court
              </Button>
            </CardTitle>
            {errors.courts && <p className="text-red-500 text-sm">{errors.courts}</p>}
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.courts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No courts added yet. Click "Add Court" to get started.</p>
              </div>
            ) : (
              formData.courts.map((court, index) => (
                <Card key={court.id} className="relative">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Court {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCourt(court.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Court Name *</Label>
                        <Input
                          placeholder="Enter court name"
                          value={court.name}
                          onChange={(e) => updateCourt(court.id, { name: e.target.value })}
                          className={errors[`court_${index}_name`] ? "border-red-500" : ""}
                        />
                        {errors[`court_${index}_name`] && (
                          <p className="text-red-500 text-sm">{errors[`court_${index}_name`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Sport Type *</Label>
                        <Select
                          value={court.sportType}
                          onValueChange={(value) => updateCourt(court.id, { sportType: value })}
                        >
                          <SelectTrigger className={errors[`court_${index}_sport`] ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_SPORTS.map((sport) => (
                              <SelectItem key={sport} value={sport}>
                                {sport}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`court_${index}_sport`] && (
                          <p className="text-red-500 text-sm">{errors[`court_${index}_sport`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Price per Hour (₹) *</Label>
                        <Input
                          type="number"
                          placeholder="Enter price"
                          value={court.pricePerHour || ''}
                          onChange={(e) => updateCourt(court.id, { pricePerHour: Number(e.target.value) })}
                          className={errors[`court_${index}_price`] ? "border-red-500" : ""}
                        />
                        {errors[`court_${index}_price`] && (
                          <p className="text-red-500 text-sm">{errors[`court_${index}_price`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Max Players</Label>
                        <Input
                          type="number"
                          placeholder="Max players"
                          value={court.maxPlayers}
                          onChange={(e) => updateCourt(court.id, { maxPlayers: Number(e.target.value) })}
                          min="1"
                          max="22"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Opening Time</Label>
                        <Input
                          type="time"
                          value={court.operatingHours.start}
                          onChange={(e) => updateCourt(court.id, { 
                            operatingHours: { ...court.operatingHours, start: e.target.value }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Closing Time</Label>
                        <Input
                          type="time"
                          value={court.operatingHours.end}
                          onChange={(e) => updateCourt(court.id, { 
                            operatingHours: { ...court.operatingHours, end: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/owner/venues')}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createVenueMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {createVenueMutation.isPending ? 'Creating...' : 'Create Venue'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateVenue;
