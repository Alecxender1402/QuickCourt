import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  DollarSign,
} from "lucide-react";
import { useMyVenues } from "@/services/venueService";
import { useBookings, useUpdateBookingStatus } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatTimeRange } from "@/utils/timeUtils";

const BookingOverview = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const { toast } = useToast();
  const { data: venues, isLoading: venuesLoading } = useMyVenues();
  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch,
  } = useBookings({
    venueId: selectedVenue !== "all" ? parseInt(selectedVenue) : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });
  const updateBookingMutation = useUpdateBookingStatus();

  const handleStatusUpdate = async (
    bookingId: number,
    newStatus: "confirmed" | "cancelled",
    reason?: string
  ) => {
    try {
      await updateBookingMutation.mutateAsync({
        bookingId,
        status: newStatus,
        reason,
      });

      toast({
        title: "Booking Updated",
        description: `Booking has been ${newStatus} successfully`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} booking`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        icon: AlertCircle,
        color: "text-yellow-600",
      },
      confirmed: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
      completed: {
        variant: "outline" as const,
        icon: CheckCircle,
        color: "text-gray-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredBookings = bookings?.filter((booking) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") {
      return (
        ["pending", "confirmed"].includes(booking.status) &&
        new Date(booking.bookingDate) >= new Date()
      );
    }
    if (activeTab === "past") {
      return (
        ["completed", "cancelled"].includes(booking.status) ||
        new Date(booking.bookingDate) < new Date()
      );
    }
    return booking.status === activeTab;
  });

const totalRevenue =
  filteredBookings?.reduce((sum, booking) => {
    const amount = Number(booking.totalAmount) || 0; // ensure it's a number
    return booking.status === "confirmed" || booking.status === "completed"
      ? sum + amount
      : sum;
  }, 0) || 0;


  return (
    <div className="container py-10">
      <SEO
        title="Booking Overview – QuickCourt"
        description="View and manage all bookings for your facilities."
      />
      <PageHeader
        title="Booking Overview"
        subtitle="Manage your facility bookings"
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Venue</label>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
                  <SelectValue placeholder="All venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues?.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                {bookingsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {filteredBookings?.length || 0}
                  </p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Confirmed Bookings
                </p>
                {bookingsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {filteredBookings?.filter((b) => b.status === "confirmed")
                      .length || 0}
                  </p>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                {bookingsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {bookingsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredBookings && filteredBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Venue & Court</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">
                                {booking.user_name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.user_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">
                                {booking.venue_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.court_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(booking.bookingDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTimeRange(booking.startTime, booking.endTime)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {booking.sport_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ₹{booking.totalAmount}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusUpdate(booking.id, "confirmed")
                                  }
                                  disabled={updateBookingMutation.isPending}
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      booking.id,
                                      "cancelled",
                                      "Cancelled by facility owner"
                                    )
                                  }
                                  disabled={updateBookingMutation.isPending}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusUpdate(
                                    booking.id,
                                    "cancelled",
                                    "Cancelled by facility owner"
                                  )
                                }
                                disabled={updateBookingMutation.isPending}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No bookings found for the selected criteria.</p>
                  <p className="text-sm">
                    Bookings will appear here when customers make reservations.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingOverview;
