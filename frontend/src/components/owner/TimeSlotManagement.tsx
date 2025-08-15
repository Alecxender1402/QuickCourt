import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Settings,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Court } from "../../lib/types";
import timeSlotService, {
  TimeSlot,
  CreateTimeSlotRequest,
  GenerateDefaultSlotsRequest,
} from "../../services/timeSlotService";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
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
        description: "You must be logged in to manage time slots",
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
        description: "You must be a facility owner or admin to manage time slots",
        variant: "destructive",
      });
      return;
    }
    
    console.log("✅ Authentication check passed!");
  }, [user, token, isAuthenticated, toast]);

  const [loading, setLoading] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [dayOfWeek: number]: TimeSlot[];
  }>({});
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<TimeSlot | null>(null);

  // Add slot form state
  const [newSlot, setNewSlot] = useState<CreateTimeSlotRequest>({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
  });

  // Generate slots form state
  const [generateConfig, setGenerateConfig] =
    useState<GenerateDefaultSlotsRequest>({
      operatingHours: {
        start: "09:00",
        end: "21:00",
      },
      daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
    });

  const fetchWeeklySchedule = useCallback(async () => {
    try {
      setLoading(true);
      const schedule = await timeSlotService.getWeeklySchedule(
        court.venueId,
        court.id
      );
      setWeeklySchedule(schedule);
      
      // Check if schedule is empty and show helpful message
      const hasAnySlots = Object.values(schedule).some(daySlots => daySlots.length > 0);
      if (!hasAnySlots) {
        toast({
          title: "No Time Slots Found",
          description: "No time slots have been generated for this court yet. Use 'Generate Default Slots' to create them.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to fetch time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [court.id, court.venueId, toast]);

  useEffect(() => {
    fetchWeeklySchedule();
  }, [fetchWeeklySchedule]);

  const handleAddSlot = async () => {
    try {
      setLoading(true);
      await timeSlotService.createTimeSlots(court.venueId, court.id, {
        timeSlots: [newSlot],
      });

      toast({
        title: "Success",
        description: "Time slot created successfully",
      });

      setShowAddSlotDialog(false);
      setNewSlot({
        dayOfWeek: selectedDay,
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
      });

      await fetchWeeklySchedule();
    } catch (error) {
      console.error("Failed to create time slot:", error);
      toast({
        title: "Error",
        description: "Failed to create time slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlots = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Generating time slots with config:', {
        venueId: court.venueId,
        courtId: court.id,
        generateConfig
      });
      
      await timeSlotService.generateDefaultTimeSlots(
        court.venueId,
        court.id,
        generateConfig
      );

      toast({
        title: "Success",
        description: "Time slots generated successfully",
      });

      setShowGenerateDialog(false);
      await fetchWeeklySchedule();
    } catch (error) {
      console.error("Failed to generate time slots:", error);
      toast({
        title: "Error",
        description: `Failed to generate time slots: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = async (slot: TimeSlot) => {
    try {
      await timeSlotService.updateTimeSlot(court.venueId, court.id, slot.id, {
        isAvailable: !slot.isAvailable,
      });

      toast({
        title: "Success",
        description: `Time slot ${slot.isAvailable ? "disabled" : "enabled"}`,
      });

      await fetchWeeklySchedule();
    } catch (error) {
      console.error("Failed to toggle time slot:", error);
      toast({
        title: "Error",
        description: "Failed to update time slot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;

    try {
      await timeSlotService.deleteTimeSlot(
        court.venueId,
        court.id,
        slotToDelete.id
      );

      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });

      setShowDeleteDialog(false);
      setSlotToDelete(null);
      await fetchWeeklySchedule();
    } catch (error) {
      console.error("Failed to delete time slot:", error);
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
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

  const getDaySlots = (dayOfWeek: number) => {
    return weeklySchedule[dayOfWeek] || [];
  };

  const getBookedDaySlots = (dayOfWeek: number) => {
    return (weeklySchedule[dayOfWeek] || []).filter(slot => !slot.isAvailable);
  };

  const getTotalSlots = () => {
    return Object.values(weeklySchedule).flat().length;
  };

  const getAvailableSlots = () => {
    return Object.values(weeklySchedule)
      .flat()
      .filter((slot) => slot.isAvailable).length;
  };

  const getBookedSlots = () => {
    return Object.values(weeklySchedule)
      .flat()
      .filter((slot) => !slot.isAvailable).length; // Booked slots are marked as unavailable
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Time Slot Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage availability schedule for {court.name}
          </p>
        </div>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {getTotalSlots()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Booked Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getBookedSlots()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getAvailableSlots()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getTotalSlots() - getAvailableSlots()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Days Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                Object.values(weeklySchedule).filter(
                  (slots) => slots.length > 0
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowAddSlotDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Time Slot
        </Button>
        <Button onClick={() => setShowGenerateDialog(true)} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Generate Slots
        </Button>
      </div>

      {/* Day Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Day Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedDay === -1 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(-1)}
            >
              All Days
            </Button>
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day.value}
                variant={selectedDay === day.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day.value)}
              >
                {day.short}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDay === -1
              ? "All Time Slots"
              : `${DAYS_OF_WEEK[selectedDay]?.label} Time Slots`}
          </CardTitle>
          <CardDescription>
            Manage availability for individual time slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDay === -1 ? (
                // Show all days
                DAYS_OF_WEEK.map((day) => {
                  const daySlots = getBookedDaySlots(day.value); // Only show booked slots
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day.value} className="space-y-2">
                      <h4 className="font-medium text-gray-900">{day.label} - Booked Slots</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3 border rounded-lg flex items-center justify-between bg-blue-50 border-blue-200"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {formatTime(slot.startTime)} -{" "}
                                {formatTime(slot.endTime)}
                              </span>
                              <Badge variant="default">
                                Booked
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleSlot(slot)}
                              >
                                <ToggleLeft className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSlotToDelete(slot);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show selected day only
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getDaySlots(selectedDay).length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No time slots configured for this day</p>
                      <Button
                        onClick={() => setShowAddSlotDialog(true)}
                        variant="outline"
                        className="mt-4"
                      >
                        Add Time Slot
                      </Button>
                    </div>
                  ) : (
                    getBookedDaySlots(selectedDay).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No booked slots for this day
                      </div>
                    ) : (
                    getBookedDaySlots(selectedDay).map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 border rounded-lg bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="default">
                            Booked
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleSlot(slot)}
                            >
                              {slot.isAvailable ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-red-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSlotToDelete(slot);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Time Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
            <DialogDescription>
              Create a new time slot for {court.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select
                value={newSlot.dayOfWeek.toString()}
                onValueChange={(value) =>
                  setNewSlot({ ...newSlot, dayOfWeek: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={newSlot.endTime}
                  onValueChange={(value) =>
                    setNewSlot({ ...newSlot, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
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
              onClick={() => setShowAddSlotDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={loading}>
              {loading ? "Creating..." : "Create Slot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Slots Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Default Time Slots</DialogTitle>
            <DialogDescription>
              Automatically create time slots based on operating hours
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startHour">Opening Time</Label>
                <Select
                  value={generateConfig.operatingHours?.start}
                  onValueChange={(value) =>
                    setGenerateConfig({
                      ...generateConfig,
                      operatingHours: {
                        ...generateConfig.operatingHours!,
                        start: value,
                      },
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
                <Label htmlFor="endHour">Closing Time</Label>
                <Select
                  value={generateConfig.operatingHours?.end}
                  onValueChange={(value) =>
                    setGenerateConfig({
                      ...generateConfig,
                      operatingHours: {
                        ...generateConfig.operatingHours!,
                        end: value,
                      },
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
            <div className="space-y-2">
              <Label>Days to Generate</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={
                      generateConfig.daysOfWeek?.includes(day.value)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      const currentDays = generateConfig.daysOfWeek || [];
                      if (currentDays.includes(day.value)) {
                        setGenerateConfig({
                          ...generateConfig,
                          daysOfWeek: currentDays.filter(
                            (d) => d !== day.value
                          ),
                        });
                      } else {
                        setGenerateConfig({
                          ...generateConfig,
                          daysOfWeek: [...currentDays, day.value],
                        });
                      }
                    }}
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateSlots} disabled={loading}>
              {loading ? "Generating..." : "Generate Slots"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time slot? This action cannot
              be undone and may affect existing bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
