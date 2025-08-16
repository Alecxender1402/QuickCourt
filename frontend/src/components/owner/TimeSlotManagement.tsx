import React, { useState, useEffect, useCallback } from "react";
import { Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Court } from "../../lib/types";
import timeSlotService from "../../services/timeSlotService";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? 0 : 30;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const today = new Date();
  const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, 0);
  const display = timeDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { value: time, label: display };
});

interface TimeSlotManagementProps {
  court: Court;
  onClose: () => void;
}

export default function TimeSlotManagement({
  court,
  onClose,
}: TimeSlotManagementProps) {
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuth();
  
  // Debug authentication status
  useEffect(() => {
    console.log("🔍 TimeSlotManagement - Authentication Debug:");
    console.log("  - isAuthenticated:", isAuthenticated);
    console.log("  - user:", user);
    console.log("  - user role:", user?.role);
    console.log("  - token present:", !!token);
    console.log("  - token preview:", token ? `${token.substring(0, 20)}...` : 'none');
    
    if (!isAuthenticated) {
      console.error("❌ User is not authenticated!");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to manage operating hours",
        variant: "destructive",
      });
      return;
    }
    
    if (user?.role !== 'facility_owner' && user?.role !== 'admin') {
      console.error("❌ User does not have sufficient permissions!");
      console.log("  - Required roles: facility_owner or admin");
      console.log("  - Current role:", user?.role);
      toast({
        title: "Permission Error", 
        description: "You must be a facility owner or admin to manage operating hours",
        variant: "destructive",
      });
      return;
    }
    
    console.log("✅ Authentication check passed!");
  }, [user, token, isAuthenticated, toast]);

  const [loading, setLoading] = useState(false);
  const [operatingHoursInfo, setOperatingHoursInfo] = useState<any>(null);
  const [showOperatingHoursDialog, setShowOperatingHoursDialog] = useState(false);

  // Operating hours form state (simplified)
  const [operatingHours, setOperatingHours] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    startTime: "09:00",
    endTime: "21:00",
  });

  const fetchOperatingHours = useCallback(async () => {
    try {
      setLoading(true);
      const operatingHours = await timeSlotService.getCourtOperatingHours(court.venueId, court.id);
      setOperatingHoursInfo(operatingHours);
      
      if (!operatingHours) {
        toast({
          title: "No Operating Hours Found",
          description: "No operating hours have been set for this court yet. Click 'Set Operating Hours' to configure them.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to fetch operating hours:", error);
      toast({
        title: "Error",
        description: "Failed to load operating hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [court.id, court.venueId, toast]);

  useEffect(() => {
    fetchOperatingHours();
  }, [fetchOperatingHours]);

  const handleSetOperatingHours = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Setting operating hours with config:', {
        venueId: court.venueId,
        courtId: court.id,
        operatingHours
      });
      
      // Validate operating hours
      if (!operatingHours.startDate || !operatingHours.endDate) {
        toast({
          title: "Error",
          description: "Please select start and end dates",
          variant: "destructive",
        });
        return;
      }
      
      if (new Date(operatingHours.endDate) < new Date(operatingHours.startDate)) {
        toast({
          title: "Error",
          description: "End date must be after start date",
          variant: "destructive",
        });
        return;
      }
      
      if (operatingHours.startTime >= operatingHours.endTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      // Save operating hours to the court (all days of the week by default)
      await timeSlotService.setCourtOperatingHours(court.venueId, court.id, {
        startDate: operatingHours.startDate,
        endDate: operatingHours.endDate,
        startTime: operatingHours.startTime,
        endTime: operatingHours.endTime,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days of the week
      });

      toast({
        title: "Success",
        description: "Operating hours set successfully",
      });

      setShowOperatingHoursDialog(false);
      await fetchOperatingHours();
    } catch (error) {
      console.error("Failed to set operating hours:", error);
      toast({
        title: "Error",
        description: `Failed to set operating hours: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const today = new Date();
    const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
    return timeDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Operating Hours Management
          </h2>
          <p className="text-gray-600 mt-1">
            Set operating hours for {court.name}
          </p>
          {operatingHoursInfo && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Current Operating Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
                <div>
                  <span className="font-medium">Date Range:</span><br />
                  {new Date(operatingHoursInfo.startDate).toLocaleDateString()} to {new Date(operatingHoursInfo.endDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Daily Hours:</span><br />
                  {formatTime(operatingHoursInfo.startTime)} - {formatTime(operatingHoursInfo.endTime)}
                </div>
              </div>
            </div>
          )}
        </div>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>

      {/* Action Button */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowOperatingHoursDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Set Operating Hours
        </Button>
      </div>

      {/* Set Operating Hours Dialog */}
      <Dialog open={showOperatingHoursDialog} onOpenChange={setShowOperatingHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Operating Hours</DialogTitle>
            <DialogDescription>
              Set the date range and daily operating hours for this court
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={operatingHours.startDate}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={operatingHours.endDate}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            
            {/* Daily Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Opening Time</Label>
                <Select
                  value={operatingHours.startTime}
                  onValueChange={(value) =>
                    setOperatingHours({
                      ...operatingHours,
                      startTime: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opening time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.slice(0, 24).map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Closing Time</Label>
                <Select
                  value={operatingHours.endTime}
                  onValueChange={(value) =>
                    setOperatingHours({
                      ...operatingHours,
                      endTime: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Closing time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.slice(12, 48).map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowOperatingHoursDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSetOperatingHours} disabled={loading}>
              {loading ? "Setting..." : "Set Operating Hours"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
