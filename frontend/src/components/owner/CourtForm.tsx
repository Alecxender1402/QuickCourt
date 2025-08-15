import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Court, Venue, CreateCourtRequest } from "../../lib/types";
import courtService from "../../services/courtService";

const SPORT_TYPES = [
  "Football",
  "Basketball",
  "Tennis",
  "Badminton",
  "Cricket",
  "Swimming",
  "Table Tennis",
  "Volleyball",
  "Squash",
  "Hockey",
];

interface CourtFormProps {
  court?: Court | null;
  venues: Venue[];
  onSave: () => void;
  onCancel: () => void;
}

export default function CourtForm({
  court,
  venues,
  onSave,
  onCancel,
}: CourtFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    venueId: 0,
    name: "",
    sportType: "",
    description: "",
    pricePerHour: 0,
    capacity: 1,
  });

  useEffect(() => {
    if (court) {
      setFormData({
        venueId: court.venueId,
        name: court.name,
        sportType: court.sportType,
        description: court.description || "",
        pricePerHour: court.pricePerHour,
        capacity: court.capacity,
      });
    } else {
      // Reset form for new court
      setFormData({
        venueId: venues[0]?.id || 0,
        name: "",
        sportType: "",
        description: "",
        pricePerHour: 0,
        capacity: 1,
      });
    }
  }, [court, venues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.venueId ||
      !formData.name ||
      !formData.sportType ||
      formData.pricePerHour <= 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const courtData: CreateCourtRequest = {
        venueId: formData.venueId,
        name: formData.name.trim(),
        sportType: formData.sportType,
        description: formData.description.trim(),
        pricePerHour: formData.pricePerHour,
        capacity: formData.capacity,
      };

      if (court) {
        await courtService.updateCourt(court.id, courtData);
        toast({
          title: "Success",
          description: "Court updated successfully",
        });
      } else {
        await courtService.createCourt(courtData);
        toast({
          title: "Success",
          description: "Court created successfully",
        });
      }

      onSave();
    } catch (error) {
      console.error("Failed to save court:", error);
      toast({
        title: "Error",
        description: court
          ? "Failed to update court"
          : "Failed to create court",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Venue Selection */}
      <div className="space-y-2">
        <Label htmlFor="venueId">Venue *</Label>
        <Select
          value={formData.venueId.toString()}
          onValueChange={(value) =>
            handleInputChange("venueId", parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a venue" />
          </SelectTrigger>
          <SelectContent>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id.toString()}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Court Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Court Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g., Court 1, Main Court, Tennis Court A"
          required
        />
      </div>

      {/* Sport Type */}
      <div className="space-y-2">
        <Label htmlFor="sportType">Sport Type *</Label>
        <Select
          value={formData.sportType}
          onValueChange={(value) => handleInputChange("sportType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sport type" />
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Additional details about the court..."
          rows={3}
        />
      </div>

      {/* Price and Capacity Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price per Hour */}
        <div className="space-y-2">
          <Label htmlFor="pricePerHour">Price per Hour (₹) *</Label>
          <Input
            id="pricePerHour"
            type="number"
            min="1"
            step="1"
            value={formData.pricePerHour}
            onChange={(e) =>
              handleInputChange("pricePerHour", parseInt(e.target.value) || 0)
            }
            placeholder="500"
            required
          />
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (Players) *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="50"
            value={formData.capacity}
            onChange={(e) =>
              handleInputChange("capacity", parseInt(e.target.value) || 1)
            }
            placeholder="10"
            required
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {court ? "Updating..." : "Creating..."}
            </div>
          ) : court ? (
            "Update Court"
          ) : (
            "Create Court"
          )}
        </Button>
      </div>
    </form>
  );
}
