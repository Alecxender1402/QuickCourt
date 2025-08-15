import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Building, Edit, Trash2, Plus } from "lucide-react";
import {
  useMyVenues,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
  useCreateCourt,
  useUpdateCourt,
  useDeleteCourt,
  useMyCourts,
} from "@/services/venueService";
import { useToast } from "@/hooks/use-toast";

const SPORT_TYPES = [
  "Badminton",
  "Tennis",
  "Football",
  "Cricket",
  "Basketball",
  "Hockey",
  "Table Tennis",
  "Swimming",
  "Other",
];

const FacilityManagement = () => {
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    amenities: "",
    operatingHours: "",
  });
  const [courtForm, setCourtForm] = useState({
    name: "",
    sportType: "",
    pricePerHour: "",
    description: "",
  });
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<number | null>(null);

  const { toast } = useToast();
  const { data: venues, isLoading: venuesLoading } = useMyVenues();
  const { data: courts, isLoading: courtsLoading } = useMyCourts(
    selectedVenue || 0
  );

  const createVenueMutation = useCreateVenue();
  const updateVenueMutation = useUpdateVenue();
  const deleteVenueMutation = useDeleteVenue();
  const createCourtMutation = useCreateCourt();
  const updateCourtMutation = useUpdateCourt();
  const deleteCourtMutation = useDeleteCourt();

  // Set the first venue as selected by default
  useEffect(() => {
    if (venues && venues.length > 0 && !selectedVenue) {
      setSelectedVenue(venues[0].id);
    }
  }, [venues, selectedVenue]);

  // Load venue data when editing
  useEffect(() => {
    if (isEditingVenue && selectedVenue && venues) {
      const venue = venues.find((v) => v.id === selectedVenue);
      if (venue) {
        setVenueForm({
          name: venue.name,
          description: venue.description || "",
          address: venue.address,
          phone: venue.phone || "",
          amenities: venue.amenities?.join(", ") || "",
          operatingHours: venue.operatingHours || "",
        });
      }
    }
  }, [isEditingVenue, selectedVenue, venues]);

  const handleCreateVenue = async () => {
    if (!venueForm.name || !venueForm.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in venue name and address",
        variant: "destructive",
      });
      return;
    }

    try {
      await createVenueMutation.mutateAsync({
        name: venueForm.name,
        description: venueForm.description,
        address: venueForm.address,
        phone: venueForm.phone,
        amenities: venueForm.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        operatingHours: venueForm.operatingHours,
      });

      toast({
        title: "Venue Created",
        description: "Your venue has been created successfully",
      });

      // Reset form
      setVenueForm({
        name: "",
        description: "",
        address: "",
        phone: "",
        amenities: "",
        operatingHours: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create venue",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVenue = async () => {
    if (!selectedVenue || !venueForm.name || !venueForm.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in venue name and address",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateVenueMutation.mutateAsync({
        venueId: selectedVenue,
        name: venueForm.name,
        description: venueForm.description,
        address: venueForm.address,
        phone: venueForm.phone,
        amenities: venueForm.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        operatingHours: venueForm.operatingHours,
      });

      toast({
        title: "Venue Updated",
        description: "Your venue has been updated successfully",
      });

      setIsEditingVenue(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update venue",
        variant: "destructive",
      });
    }
  };

  const handleCreateCourt = async () => {
    if (
      !selectedVenue ||
      !courtForm.name ||
      !courtForm.sportType ||
      !courtForm.pricePerHour
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all court details",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCourtMutation.mutateAsync({
        venueId: selectedVenue,
        name: courtForm.name,
        sportType: courtForm.sportType,
        pricePerHour: parseFloat(courtForm.pricePerHour),
        description: courtForm.description,
      });

      toast({
        title: "Court Added",
        description: "Court has been added successfully",
      });

      // Reset form
      setCourtForm({
        name: "",
        sportType: "",
        pricePerHour: "",
        description: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add court",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (!selectedVenue) return;

    try {
      await deleteCourtMutation.mutateAsync({
        venueId: selectedVenue,
        courtId,
      });

      toast({
        title: "Court Deleted",
        description: "Court has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete court",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-10">
      <SEO
        title="Facility Management – QuickCourt"
        description="Add or edit your facility and manage courts."
      />
      <PageHeader title="Facility Management" />

      {/* Venue Selector */}
      {venues && venues.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Select Venue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Select
                value={selectedVenue?.toString() || ""}
                onValueChange={(value) => setSelectedVenue(parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{venue.name}</span>
                        <Badge
                          variant={venue.isApproved ? "default" : "secondary"}
                        >
                          {venue.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setIsEditingVenue(!isEditingVenue)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditingVenue ? "Cancel Edit" : "Edit Venue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isEditingVenue ? "Edit Venue" : "Create New Venue"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Venue Name</Label>
            <Input
              placeholder="Arena name"
              value={venueForm.name}
              onChange={(e) =>
                setVenueForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Address</Label>
            <Input
              placeholder="Full address"
              value={venueForm.address}
              onChange={(e) =>
                setVenueForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone</Label>
            <Input
              placeholder="Contact number"
              value={venueForm.phone}
              onChange={(e) =>
                setVenueForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Operating Hours</Label>
            <Input
              placeholder="e.g., 06:00 - 22:00"
              value={venueForm.operatingHours}
              onChange={(e) =>
                setVenueForm((prev) => ({
                  ...prev,
                  operatingHours: e.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2 grid gap-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your facility"
              value={venueForm.description}
              onChange={(e) =>
                setVenueForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2 grid gap-2">
            <Label>Amenities (comma-separated)</Label>
            <Input
              placeholder="Parking, Water, Changing Rooms, ..."
              value={venueForm.amenities}
              onChange={(e) =>
                setVenueForm((prev) => ({ ...prev, amenities: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={isEditingVenue ? handleUpdateVenue : handleCreateVenue}
              disabled={
                createVenueMutation.isPending || updateVenueMutation.isPending
              }
            >
              {isEditingVenue ? "Update Venue" : "Create Venue"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedVenue && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Add Court */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Court
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Court Name</Label>
                <Input
                  placeholder="Court 1"
                  value={courtForm.name}
                  onChange={(e) =>
                    setCourtForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Sport Type</Label>
                <Select
                  value={courtForm.sportType}
                  onValueChange={(value) =>
                    setCourtForm((prev) => ({ ...prev, sportType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_TYPES.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Price per Hour (₹)</Label>
                <Input
                  type="number"
                  placeholder="349"
                  value={courtForm.pricePerHour}
                  onChange={(e) =>
                    setCourtForm((prev) => ({
                      ...prev,
                      pricePerHour: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Court specific details"
                  value={courtForm.description}
                  onChange={(e) =>
                    setCourtForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                onClick={handleCreateCourt}
                disabled={createCourtMutation.isPending}
              >
                Add Court
              </Button>
            </CardContent>
          </Card>

          {/* Existing Courts */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Courts</CardTitle>
            </CardHeader>
            <CardContent>
              {courtsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : courts && courts.length > 0 ? (
                <div className="space-y-3">
                  {courts.map((court) => (
                    <div
                      key={court.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{court.name}</h4>
                        <p className="text-sm text-gray-600">
                          {court.sportType} • ₹{court.pricePerHour}/hr
                        </p>
                        {court.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {court.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCourtId(court.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCourt(court.id)}
                          disabled={deleteCourtMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    No courts added yet. Add your first court to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FacilityManagement;
