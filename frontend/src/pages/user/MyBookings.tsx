import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUserBookings, useCancelBooking } from "@/services/bookingService";
import { useState } from "react";
import { Calendar, Clock, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(
    null
  );
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();

  // Get real booking data from API
  const { data: bookingsData, isLoading: bookingsLoading } = useUserBookings({
    limit: 50,
    offset: 0,
  });

  const cancelBookingMutation = useCancelBooking();

  const bookings = bookingsData?.items || [];

  const handleCancelBooking = (bookingId: number) => {
    setCancellingBookingId(bookingId);
    setShowCancelDialog(true);
  };

  const confirmCancelBooking = async () => {
    if (!cancellingBookingId) return;

    try {
      await cancelBookingMutation.mutateAsync({
        bookingId: cancellingBookingId,
        reason: cancelReason,
      });

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });

      setShowCancelDialog(false);
      setCancellingBookingId(null);
      setCancelReason("");
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") {
      return (
        booking.status === "confirmed" &&
        new Date(booking.bookingDate) >= new Date()
      );
    }
    if (activeTab === "completed") return booking.status === "completed";
    if (activeTab === "cancelled") return booking.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container py-10">
      <SEO
        title="My Bookings – QuickCourt"
        description="Review your current and past court bookings."
      />
      <PageHeader title="My Bookings" />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
          className={
            activeTab === "all" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          All Bookings
        </Button>
        <Button
          variant={activeTab === "upcoming" ? "default" : "outline"}
          onClick={() => setActiveTab("upcoming")}
          className={
            activeTab === "upcoming" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          Upcoming
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "outline"}
          onClick={() => setActiveTab("completed")}
          className={
            activeTab === "completed" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          Completed
        </Button>
        <Button
          variant={activeTab === "cancelled" ? "default" : "outline"}
          onClick={() => setActiveTab("cancelled")}
          className={
            activeTab === "cancelled" ? "bg-green-600 hover:bg-green-700" : ""
          }
        >
          Cancelled
        </Button>
      </div>

      <div className="grid gap-4">
        {bookingsLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {activeTab === "all" ? "" : activeTab} bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{booking.venue?.name || "Venue"}</span>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(booking.status)}
                  >
                    {booking.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Sport:</span>
                      <span>{booking.court?.sportType || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Court:</span>
                      <span>{booking.court?.name || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {booking.venue?.address || "Location not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Amount:</span>
                      <span>₹{booking.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <span className="font-medium">Notes: </span>
                    <span>{booking.notes}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {booking.status === "confirmed" &&
                    new Date(booking.bookingDate) >= new Date() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelBookingMutation.isPending}
                      >
                        {cancelBookingMutation.isPending &&
                        cancellingBookingId === booking.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Booking"
                        )}
                      </Button>
                    )}
                  {booking.status === "completed" && (
                    <Button variant="outline" size="sm">
                      Write Review
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Are you sure you want to cancel this booking? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="cancel-reason">
                Reason for cancellation (optional)
              </Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelBookingMutation.isPending}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelBooking}
                disabled={cancelBookingMutation.isPending}
              >
                {cancelBookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
