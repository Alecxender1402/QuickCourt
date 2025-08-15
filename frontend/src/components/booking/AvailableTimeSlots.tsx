import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Clock, CalendarDays, MapPin, DollarSign, Ban, AlertCircle } from "lucide-react";
import { useAllCourtTimeSlots } from "@/services/venueService";
import { Court, TimeSlot } from "@/lib/types";
import { format, addDays, isToday, isTomorrow, isYesterday } from "date-fns";

interface AvailableTimeSlotsProps {
  court: Court;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onSlotSelect?: (slot: TimeSlot, date: Date) => void;
  selectedSlot?: TimeSlot | null;
}

const AvailableTimeSlots: React.FC<AvailableTimeSlotsProps> = ({
  court,
  selectedDate = new Date(),
  onDateChange,
  onSlotSelect,
  selectedSlot,
}) => {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  const dateString = format(selectedDate, "yyyy-MM-dd");
  const {
    data: timeSlotsData,
    isLoading,
    error,
  } = useAllCourtTimeSlots(court.id, dateString);

  // Extract all slots from the response
  const allTimeSlots = timeSlotsData?.allSlots || [];
  
  // Filter out past time slots if the selected date is today
  const filteredTimeSlots = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isSelectedDateToday = selectedDate.getTime() === today.getTime();
    
    if (!isSelectedDateToday) {
      return allTimeSlots;
    }
    
    // If it's today, filter out past time slots
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    return allTimeSlots.filter(slot => {
      const [startHour, startMinute] = slot.formattedStartTime.split(':').map(Number);
      const slotStartMinutes = startHour * 60 + startMinute;
      
      // Only show slots that start in the future
      return slotStartMinutes > currentTimeMinutes;
    });
  }, [allTimeSlots, selectedDate]);
  
  const availableSlots = filteredTimeSlots.filter(slot => slot.isAvailable);
  const unavailableSlots = filteredTimeSlots.filter(slot => !slot.isAvailable);

  // Group time slots by time periods (including both available and unavailable)
  const groupedSlots = useMemo(() => {
    const morning: any[] = [];
    const afternoon: any[] = [];
    const evening: any[] = [];

    filteredTimeSlots.forEach((slot) => {
      const hour = parseInt(slot.formattedStartTime.split(":")[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [filteredTimeSlots]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd, yyyy");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateChange) {
      onDateChange(date);
    }
  };

  const handleSlotClick = (slot: any) => {
    // Only allow clicking on available slots
    if (slot.isAvailable && onSlotSelect) {
      onSlotSelect(slot, selectedDate);
    }
  };

  const isSlotSelected = (slot: any) => {
    return selectedSlot?.id === slot.id;
  };

  const quickDates = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: addDays(new Date(), 1) },
    { label: "Day After", date: addDays(new Date(), 2) },
  ];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-2">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load available time slots</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Court Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {court.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {court.sportType}
              </Badge>
              {court.venue && (
                <p className="text-sm text-muted-foreground">
                  {court.venue.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-semibold">
                <DollarSign className="w-4 h-4" />
                {court.pricePerHour}/hour
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Select Date
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                Calendar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "calendar" ? (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date < new Date() || date > addDays(new Date(), 30)
              }
              className="rounded-md border"
            />
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                Quick select:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {quickDates.map((item, index) => (
                  <Button
                    key={index}
                    variant={
                      format(selectedDate, "yyyy-MM-dd") ===
                      format(item.date, "yyyy-MM-dd")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleDateSelect(item.date)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Selected Date:
                </div>
                <div className="text-lg font-semibold">
                  {getDateLabel(selectedDate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Slots
            </div>
            <div className="flex gap-2">
              <Badge variant="default">
                {availableSlots.length} available
              </Badge>
              {unavailableSlots.length > 0 && (
                <Badge variant="secondary">
                  {unavailableSlots.length} unavailable
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          {filteredTimeSlots.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-green-600" />
                  <span>Available for booking</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ban className="w-3 h-3 text-red-600" />
                  <span>Already booked</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-orange-600" />
                  <span>Blocked by venue</span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTimeSlots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Time Slots Available</h3>
              <p className="text-muted-foreground mb-4">
                There are no time slots configured for{" "}
                {getDateLabel(selectedDate)}.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDateSelect(addDays(selectedDate, 1))}
                >
                  Try Tomorrow
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode("calendar")}
                >
                  Pick Different Date
                </Button>
              </div>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">All Slots Unavailable</h3>
              <p className="text-muted-foreground mb-4">
                All time slots for {getDateLabel(selectedDate)} are either booked or blocked.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• {unavailableSlots.filter(s => s.hasConflict).length} slots booked by other users</p>
                  <p>• {unavailableSlots.filter(s => s.isBlocked).length} slots blocked by venue</p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDateSelect(addDays(selectedDate, 1))}
                  >
                    Try Tomorrow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("calendar")}
                  >
                    Pick Different Date
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Morning Slots */}
              {groupedSlots.morning.length > 0 && (
                <TimeSlotGroup
                  title="Morning"
                  subtitle="6:00 AM - 12:00 PM"
                  slots={groupedSlots.morning}
                  court={court}
                  onSlotSelect={handleSlotClick}
                  selectedSlot={selectedSlot}
                />
              )}

              {/* Afternoon Slots */}
              {groupedSlots.afternoon.length > 0 && (
                <TimeSlotGroup
                  title="Afternoon"
                  subtitle="12:00 PM - 5:00 PM"
                  slots={groupedSlots.afternoon}
                  court={court}
                  onSlotSelect={handleSlotClick}
                  selectedSlot={selectedSlot}
                />
              )}

              {/* Evening Slots */}
              {groupedSlots.evening.length > 0 && (
                <TimeSlotGroup
                  title="Evening"
                  subtitle="5:00 PM - 11:59 PM"
                  slots={groupedSlots.evening}
                  court={court}
                  onSlotSelect={handleSlotClick}
                  selectedSlot={selectedSlot}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Time Slot Group Component
interface TimeSlotGroupProps {
  title: string;
  subtitle: string;
  slots: any[];
  court: Court;
  onSlotSelect?: (slot: any) => void;
  selectedSlot?: TimeSlot | null;
}

const TimeSlotGroup: React.FC<TimeSlotGroupProps> = ({
  title,
  subtitle,
  slots,
  court,
  onSlotSelect,
  selectedSlot,
}) => {
  return (
    <div>
      <div className="mb-3">
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <TimeSlotButton
            key={slot.id}
            slot={slot}
            court={court}
            isSelected={selectedSlot?.id === slot.id}
            onClick={() => onSlotSelect?.(slot)}
          />
        ))}
      </div>
    </div>
  );
};

// Time Slot Button Component
interface TimeSlotButtonProps {
  slot: any;
  court: Court;
  isSelected: boolean;
  onClick?: () => void;
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  slot,
  court,
  isSelected,
  onClick,
}) => {
  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const duration = calculateDuration(slot.formattedStartTime, slot.formattedEndTime);
  const price = (court.pricePerHour * duration).toFixed(2);

  const getSlotVariant = () => {
    if (!slot.isAvailable) {
      return "secondary";
    }
    return isSelected ? "default" : "outline";
  };

  const getSlotIcon = () => {
    if (slot.hasConflict) {
      return <Ban className="w-3 h-3" />;
    } else if (slot.isBlocked) {
      return <AlertCircle className="w-3 h-3" />;
    } else {
      return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Button
      variant={getSlotVariant()}
      className={`
        h-auto p-3 flex flex-col items-start gap-1 text-left
        ${isSelected ? "ring-2 ring-primary" : ""}
        ${!slot.isAvailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
      onClick={slot.isAvailable ? onClick : undefined}
      disabled={!slot.isAvailable}
      title={slot.conflictReason || undefined}
    >
      <div className="flex items-center gap-1 font-semibold">
        {getSlotIcon()}
        {slot.formattedStartTime} - {slot.formattedEndTime}
      </div>

      <div className="text-xs opacity-75">
        {duration}h • ${price}
      </div>

      {!slot.isAvailable && (
        <div className="text-xs text-red-600 mt-1">
          {slot.conflictReason || "Not Available"}
        </div>
      )}
    </Button>
  );
};

export default AvailableTimeSlots;
