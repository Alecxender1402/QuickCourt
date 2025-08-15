import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Settings,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Ban,
  Unlock,
} from "lucide-react";
import {
  useTimeSlots,
  useCreateTimeSlots,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
  useGenerateDefaultTimeSlots,
  useBlockTimeSlots,
  useUnblockTimeSlots,
  useBlockedSlots,
} from "@/services/venueService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Court, TimeSlot } from "@/lib/types";

interface TimeSlotManagerProps {
  venue: {
    id: number;
    name: string;
  };
  court: Court;
}

interface TimeSlotForm {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ venue, court }) => {
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [blockReason, setBlockReason] = useState("");
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Form states
  const [timeSlotForm, setTimeSlotForm] = useState<TimeSlotForm>({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
  });

  const [generateConfig, setGenerateConfig] = useState({
    operatingHours: { start: "09:00", end: "22:00" },
    slotDuration: 60,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
  });

  // Queries
  const { data: timeSlots, isLoading } = useTimeSlots(
    venue.id,
    court.id,
    selectedDay
  );
  const { data: blockedSlots } = useBlockedSlots(
    venue.id,
    court.id,
    selectedDay
  );

  // Mutations
  const createTimeSlotsMutation = useCreateTimeSlots();
  const updateTimeSlotMutation = useUpdateTimeSlot();
  const deleteTimeSlotMutation = useDeleteTimeSlot();
  const generateDefaultSlotsMutation = useGenerateDefaultTimeSlots();
  const blockSlotsMutation = useBlockTimeSlots();
  const unblockSlotsMutation = useUnblockTimeSlots();

  // Group time slots by day
  const slotsByDay = useMemo(() => {
    if (!timeSlots) return {};

    const grouped: Record<number, TimeSlot[]> = {};
    timeSlots.forEach((slot) => {
      if (!grouped[slot.dayOfWeek]) {
        grouped[slot.dayOfWeek] = [];
      }
      grouped[slot.dayOfWeek].push(slot);
    });

    // Sort slots by start time within each day
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
    });

    return grouped;
  }, [timeSlots]);

  const handleCreateTimeSlot = async () => {
    try {
      await createTimeSlotsMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        timeSlots: [timeSlotForm],
      });

      toast({
        title: "Success",
        description: "Time slot created successfully",
      });

      setShowCreateDialog(false);
      setTimeSlotForm({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create time slot",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTimeSlot = async () => {
    if (!editingSlot) return;

    try {
      await updateTimeSlotMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        slotId: editingSlot.id,
        data: timeSlotForm,
      });

      toast({
        title: "Success",
        description: "Time slot updated successfully",
      });

      setEditingSlot(null);
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update time slot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeSlot = async (slotId: number) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      await deleteTimeSlotMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        slotId,
      });

      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const handleGenerateDefaultSlots = async () => {
    try {
      await generateDefaultSlotsMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        config: generateConfig,
      });

      toast({
        title: "Success",
        description: "Default time slots generated successfully",
      });

      setShowGenerateDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate time slots",
        variant: "destructive",
      });
    }
  };

  const handleBlockSlots = async () => {
    if (selectedSlots.length === 0) return;

    try {
      await blockSlotsMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        data: { slotIds: selectedSlots, reason: blockReason },
      });

      toast({
        title: "Success",
        description: `${selectedSlots.length} time slots blocked successfully`,
      });

      setSelectedSlots([]);
      setBlockReason("");
      setShowBlockDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to block time slots",
        variant: "destructive",
      });
    }
  };

  const handleUnblockSlots = async () => {
    if (selectedSlots.length === 0) return;

    try {
      await unblockSlotsMutation.mutateAsync({
        venueId: venue.id,
        courtId: court.id,
        data: { slotIds: selectedSlots },
      });

      toast({
        title: "Success",
        description: `${selectedSlots.length} time slots unblocked successfully`,
      });

      setSelectedSlots([]);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unblock time slots",
        variant: "destructive",
      });
    }
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setTimeSlotForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    });
    setShowCreateDialog(true);
  };

  const toggleSlotSelection = (slotId: number) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Slot Management</h2>
          <p className="text-muted-foreground">
            Manage time slots for {court.name} - {court.sportType}
          </p>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedDay?.toString() || ""}
            onValueChange={(value) =>
              setSelectedDay(value ? parseInt(value) : undefined)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All days</SelectItem>
              {DAY_NAMES.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog
            open={showGenerateDialog}
            onOpenChange={setShowGenerateDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Generate Default
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Default Time Slots</DialogTitle>
                <DialogDescription>
                  This will replace all existing time slots with a default
                  schedule.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={generateConfig.operatingHours.start}
                      onChange={(e) =>
                        setGenerateConfig((prev) => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            start: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={generateConfig.operatingHours.end}
                      onChange={(e) =>
                        setGenerateConfig((prev) => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            end: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Slot Duration (minutes)</Label>
                  <Select
                    value={generateConfig.slotDuration.toString()}
                    onValueChange={(value) =>
                      setGenerateConfig((prev) => ({
                        ...prev,
                        slotDuration: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Operating Days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAY_NAMES.map((day, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={generateConfig.daysOfWeek.includes(index)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGenerateConfig((prev) => ({
                                ...prev,
                                daysOfWeek: [...prev.daysOfWeek, index],
                              }));
                            } else {
                              setGenerateConfig((prev) => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.filter(
                                  (d) => d !== index
                                ),
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`day-${index}`} className="text-sm">
                          {day.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateDefaultSlots}
                  disabled={generateDefaultSlotsMutation.isPending}
                >
                  {generateDefaultSlotsMutation.isPending
                    ? "Generating..."
                    : "Generate Slots"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showCreateDialog}
            onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) {
                setEditingSlot(null);
                setTimeSlotForm({
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "10:00",
                  isAvailable: true,
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? "Edit Time Slot" : "Add New Time Slot"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select
                    value={timeSlotForm.dayOfWeek.toString()}
                    onValueChange={(value) =>
                      setTimeSlotForm((prev) => ({
                        ...prev,
                        dayOfWeek: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={timeSlotForm.startTime}
                      onChange={(e) =>
                        setTimeSlotForm((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={timeSlotForm.endTime}
                      onChange={(e) =>
                        setTimeSlotForm((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={timeSlotForm.isAvailable}
                    onCheckedChange={(checked) =>
                      setTimeSlotForm((prev) => ({
                        ...prev,
                        isAvailable: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="available">Available for booking</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingSlot ? handleUpdateTimeSlot : handleCreateTimeSlot
                  }
                  disabled={
                    createTimeSlotsMutation.isPending ||
                    updateTimeSlotMutation.isPending
                  }
                >
                  {editingSlot ? "Update" : "Create"} Time Slot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSlots.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedSlots.length} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedSlots.length === 1 ? "time slot" : "time slots"}{" "}
                  selected
                </span>
              </div>

              <div className="flex gap-2">
                <Dialog
                  open={showBlockDialog}
                  onOpenChange={setShowBlockDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Ban className="w-4 h-4 mr-2" />
                      Block Selected
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block Time Slots</DialogTitle>
                      <DialogDescription>
                        Block {selectedSlots.length} selected time slots from
                        being booked.
                      </DialogDescription>
                    </DialogHeader>

                    <div>
                      <Label htmlFor="reason">Reason (optional)</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for blocking..."
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowBlockDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBlockSlots}
                        disabled={blockSlotsMutation.isPending}
                      >
                        Block Slots
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnblockSlots}
                  disabled={unblockSlotsMutation.isPending}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unblock Selected
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlots([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots by Day */}
      <div className="space-y-4">
        {selectedDay !== undefined ? (
          // Show only selected day
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {DAY_NAMES[selectedDay]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slotsByDay[selectedDay]?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slotsByDay[selectedDay].map((slot) => (
                    <TimeSlotCard
                      key={slot.id}
                      slot={slot}
                      isSelected={selectedSlots.includes(slot.id)}
                      onToggleSelect={() => toggleSlotSelection(slot.id)}
                      onEdit={() => startEdit(slot)}
                      onDelete={() => handleDeleteTimeSlot(slot.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No time slots found for {DAY_NAMES[selectedDay]}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Show all days
          DAY_NAMES.map(
            (dayName, dayIndex) =>
              slotsByDay[dayIndex]?.length > 0 && (
                <Card key={dayIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      {dayName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {slotsByDay[dayIndex].map((slot) => (
                        <TimeSlotCard
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlots.includes(slot.id)}
                          onToggleSelect={() => toggleSlotSelection(slot.id)}
                          onEdit={() => startEdit(slot)}
                          onDelete={() => handleDeleteTimeSlot(slot.id)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
          )
        )}

        {(!timeSlots || timeSlots.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                No Time Slots Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating time slots or generating a default
                schedule.
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Time Slot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Generate Default
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Time Slot Card Component
interface TimeSlotCardProps {
  slot: TimeSlot;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`
        border rounded-lg p-3 transition-all cursor-pointer
        ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }
        ${!slot.isAvailable ? "opacity-60" : ""}
      `}
      onClick={onToggleSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {slot.startTime} - {slot.endTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {slot.isAvailable ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Available
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Blocked
              </Badge>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isSelected && (
        <div className="mt-2 pt-2 border-t">
          <Checkbox checked={true} readOnly />
          <span className="ml-2 text-sm text-muted-foreground">Selected</span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotManager;
