import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Settings,
  Calendar,
  Ban,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  useMyVenues,
  useMyCourts,
  useTimeSlots,
  useCreateTimeSlots,
  useUpdateTimeSlot,
  useDeleteTimeSlot,
  useGenerateDefaultTimeSlots,
  useBlockTimeSlots,
  useUnblockTimeSlots,
  useBlockedSlots,
} from "@/services/venueService";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const TimeSlots = () => {
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
  });
  const [generateConfig, setGenerateConfig] = useState({
    startTime: "09:00",
    endTime: "22:00",
    duration: 60,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Mon-Sun
  });

  const { toast } = useToast();
  const { data: venues, isLoading: venuesLoading } = useMyVenues();
  const { data: courts, isLoading: courtsLoading } = useMyCourts(
    selectedVenue || 0
  );
  const { data: timeSlotsData, isLoading: timeSlotsLoading } = useTimeSlots(
    selectedVenue || 0,
    selectedCourt || 0,
    selectedDay
  );
  const { data: blockedSlots, isLoading: blockedSlotsLoading } =
    useBlockedSlots(selectedVenue || 0, selectedCourt || 0, selectedDay);

  const createTimeSlotsMutation = useCreateTimeSlots();
  const updateTimeSlotMutation = useUpdateTimeSlot();
  const deleteTimeSlotMutation = useDeleteTimeSlot();
  const generateDefaultSlotsMutation = useGenerateDefaultTimeSlots();
  const blockSlotsMutation = useBlockTimeSlots();
  const unblockSlotsMutation = useUnblockTimeSlots();

  const timeSlots = timeSlotsData?.timeSlots || [];

  const handleCreateTimeSlot = async () => {
    if (!selectedVenue || !selectedCourt) {
      toast({
        title: "Selection Required",
        description: "Please select a venue and court first",
        variant: "destructive",
      });
      return;
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTimeSlotsMutation.mutateAsync({
        venueId: selectedVenue,
        courtId: selectedCourt,
        timeSlots: [newSlot],
      });

      toast({
        title: "Time Slot Created",
        description: "Time slot has been created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewSlot({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create time slot",
        variant: "destructive",
      });
    }
  };

  const handleGenerateDefaultSlots = async () => {
    if (!selectedVenue || !selectedCourt) {
      toast({
        title: "Selection Required",
        description: "Please select a venue and court first",
        variant: "destructive",
      });
      return;
    }

    if (generateConfig.startTime >= generateConfig.endTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateDefaultSlotsMutation.mutateAsync({
        venueId: selectedVenue,
        courtId: selectedCourt,
        config: {
          operatingHours: {
            start: generateConfig.startTime,
            end: generateConfig.endTime,
          },
          slotDuration: generateConfig.duration,
          daysOfWeek: generateConfig.daysOfWeek,
        },
      });

      toast({
        title: "Time Slots Generated",
        description: `Default time slots have been generated successfully`,
      });

      setIsGenerateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate default time slots",
        variant: "destructive",
      });
    }
  };

  const handleToggleSlotAvailability = async (
    slotId: number,
    currentStatus: boolean
  ) => {
    if (!selectedVenue || !selectedCourt) return;

    try {
      if (currentStatus) {
        // Block the slot
        await blockSlotsMutation.mutateAsync({
          venueId: selectedVenue,
          courtId: selectedCourt,
          data: { slotIds: [slotId], reason: "Blocked by owner" },
        });
        toast({
          title: "Slot Blocked",
          description: "Time slot has been blocked",
        });
      } else {
        // Unblock the slot
        await unblockSlotsMutation.mutateAsync({
          venueId: selectedVenue,
          courtId: selectedCourt,
          data: { slotIds: [slotId] },
        });
        toast({
          title: "Slot Unblocked",
          description: "Time slot has been unblocked",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${
          currentStatus ? "block" : "unblock"
        } time slot`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeSlot = async (slotId: number) => {
    if (!selectedVenue || !selectedCourt) return;

    try {
      await deleteTimeSlotMutation.mutateAsync({
        venueId: selectedVenue,
        courtId: selectedCourt,
        slotId,
      });

      toast({
        title: "Time Slot Deleted",
        description: "Time slot has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || "Unknown";
  };

  const getStatusBadge = (isAvailable: boolean) => {
    return isAvailable ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Available
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Ban className="w-3 h-3" />
        Blocked
      </Badge>
    );
  };

  return (
    <div className="container py-10">
      <SEO
        title="Time Slots Management – QuickCourt"
        description="Manage time slots and availability for your courts."
      />
      <PageHeader
        title="Time Slots Management"
        subtitle="Configure court availability"
      />

      {/* Venue and Court Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Court Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Venue</Label>
              <Select
                value={selectedVenue?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedVenue(parseInt(value));
                  setSelectedCourt(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Court</Label>
              <Select
                value={selectedCourt?.toString() || ""}
                onValueChange={(value) => setSelectedCourt(parseInt(value))}
                disabled={!selectedVenue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select court" />
                </SelectTrigger>
                <SelectContent>
                  {courts?.map((court) => (
                    <SelectItem key={court.id} value={court.id.toString()}>
                      {court.name} ({court.sportType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter by Day (Optional)</Label>
              <Select
                value={selectedDay?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedDay(value ? parseInt(value) : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Days</SelectItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedVenue && selectedCourt && (
        <>
          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Time Slot</DialogTitle>
                  <DialogDescription>
                    Add a new time slot for the selected court.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={newSlot.dayOfWeek.toString()}
                      onValueChange={(value) =>
                        setNewSlot((prev) => ({
                          ...prev,
                          dayOfWeek: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem
                            key={day.value}
                            value={day.value.toString()}
                          >
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) =>
                          setNewSlot((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) =>
                          setNewSlot((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={newSlot.isAvailable}
                      onCheckedChange={(checked) =>
                        setNewSlot((prev) => ({
                          ...prev,
                          isAvailable: checked,
                        }))
                      }
                    />
                    <Label htmlFor="available">Available for booking</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTimeSlot}
                    disabled={createTimeSlotsMutation.isPending}
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isGenerateDialogOpen}
              onOpenChange={setIsGenerateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Generate Default Slots
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Default Time Slots</DialogTitle>
                  <DialogDescription>
                    This will replace all existing time slots for this court.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={generateConfig.startTime}
                        onChange={(e) =>
                          setGenerateConfig((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={generateConfig.endTime}
                        onChange={(e) =>
                          setGenerateConfig((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Slot Duration (minutes)</Label>
                    <Select
                      value={generateConfig.duration.toString()}
                      onValueChange={(value) =>
                        setGenerateConfig((prev) => ({
                          ...prev,
                          duration: parseInt(value),
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
                  <div className="grid gap-2">
                    <Label>Operating Days</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div
                          key={day.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`day-${day.value}`}
                            checked={generateConfig.daysOfWeek.includes(
                              day.value
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGenerateConfig((prev) => ({
                                  ...prev,
                                  daysOfWeek: [...prev.daysOfWeek, day.value],
                                }));
                              } else {
                                setGenerateConfig((prev) => ({
                                  ...prev,
                                  daysOfWeek: prev.daysOfWeek.filter(
                                    (d) => d !== day.value
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`day-${day.value}`}
                            className="text-sm"
                          >
                            {day.short}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsGenerateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateDefaultSlots}
                    disabled={generateDefaultSlotsMutation.isPending}
                  >
                    Generate
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Time Slots Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Slots
                {selectedDay !== undefined && (
                  <Badge variant="outline">{getDayName(selectedDay)}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeSlotsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : timeSlots.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSlots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {getDayName(slot.dayOfWeek)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const start = new Date(
                              `1970-01-01T${slot.startTime}`
                            );
                            const end = new Date(`1970-01-01T${slot.endTime}`);
                            const duration =
                              (end.getTime() - start.getTime()) / (1000 * 60);
                            return `${duration} min`;
                          })()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(slot.isAvailable)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleSlotAvailability(
                                  slot.id,
                                  slot.isAvailable
                                )
                              }
                              disabled={
                                blockSlotsMutation.isPending ||
                                unblockSlotsMutation.isPending
                              }
                            >
                              {slot.isAvailable ? (
                                <>
                                  <Ban className="w-4 h-4" />
                                  Block
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Unblock
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTimeSlot(slot.id)}
                              disabled={deleteTimeSlotMutation.isPending}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No time slots configured for this court.</p>
                  <p className="text-sm">
                    Add time slots or generate default ones to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {(!selectedVenue || !selectedCourt) && (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select a venue and court to manage time slots.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeSlots;
