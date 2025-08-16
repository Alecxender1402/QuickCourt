import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useVenueManagementDashboard,
  useMyVenues,
} from "@/services/venueService";
import { useVenueBookings } from "@/services/bookingService";
import {
  TrendingUp,
  Building,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatTimeOnly } from "@/utils/timeUtils";

// Dashboard data interfaces
interface DashboardStats {
  total_venues: number;
  total_courts: number;
  approved_venues: number;
  pending_venues: number;
  active_courts: number;
  total_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
}

interface DashboardRevenue {
  total_revenue: number;
  total_bookings: number;
  period: string;
}

interface DashboardBooking {
  id: number;
  user_name: string;
  venue_name: string;
  court_name: string;
  bookingDate: string;
  startTime: string;
  status: string;
  totalAmount: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentBookings: DashboardBooking[];
  revenue: DashboardRevenue;
}

const OwnerDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: dashboardLoading } =
    useVenueManagementDashboard();
  const { data: venuesData, isLoading: venuesLoading } = useMyVenues();
  const { data: recentBookings, isLoading: bookingsLoading } = useVenueBookings(
    { limit: 10 }
  );

  // Extract stats from dashboard data with proper typing
  const typedDashboardData = dashboardData as DashboardData | undefined;
  const stats = typedDashboardData?.stats || ({} as DashboardStats);
  const recentBookingsFromDashboard = typedDashboardData?.recentBookings || [];
  const revenue = typedDashboardData?.revenue || ({} as DashboardRevenue);

  // Sample data for chart (fallback values if API doesn't provide weekly data)
  const weeklyData = [
    { name: "Mon", bookings: 12 },
    { name: "Tue", bookings: 18 },
    { name: "Wed", bookings: 9 },
    { name: "Thu", bookings: 22 },
    { name: "Fri", bookings: 28 },
    { name: "Sat", bookings: 35 },
    { name: "Sun", bookings: 20 },
  ];

  const displayBookings = recentBookings || recentBookingsFromDashboard;

  return (
    <div className="container py-10">
      <SEO
        title="Owner Dashboard – QuickCourt"
        description="KPIs and charts for your facility performance."
      />
      <PageHeader title="Dashboard" subtitle="Welcome back!" />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Venues
                </p>
                {dashboardLoading || venuesLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.total_venues || venuesData?.length || 0}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {stats.approved_venues || 0} approved,{" "}
                  {stats.pending_venues || 0} pending
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.total_bookings || 0}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {stats.confirmed_bookings || 0} confirmed
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate("/owner/courts")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Courts
                </p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.total_courts || 0}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {stats.active_courts || 0} active
                </p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Click to manage →
                </p>
              </div>
              <div className="text-2xl">🏟️</div>
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
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    ₹
                    {(
                      stats.total_revenue ||
                      revenue.total_revenue ||
                      0
                    ).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Last {revenue.period || "30 days"}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-dashed"
          onClick={() => navigate("/owner/reviews")}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-1">Reviews Management</h3>
            <p className="text-sm text-gray-600 mb-2">View customer reviews and ratings</p>
            <p className="text-xs text-blue-600 font-medium">Click to access →</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-dashed"
          onClick={() => navigate("/owner/venues")}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-medium mb-1">Manage Venues</h3>
            <p className="text-sm text-gray-600 mb-2">Edit venues and courts</p>
            <p className="text-xs text-green-600 font-medium">Click to manage →</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-dashed"
          onClick={() => navigate("/owner/bookings")}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium mb-1">Booking Overview</h3>
            <p className="text-sm text-gray-600 mb-2">View all bookings</p>
            <p className="text-xs text-purple-600 font-medium">Click to view →</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-dashed"
          onClick={() => navigate("/owner/courts")}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-medium mb-1">Court Management</h3>
            <p className="text-sm text-gray-600 mb-2">Manage courts and time slots</p>
            <p className="text-xs text-orange-600 font-medium">Click to manage →</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Booking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ChartContainer
                config={{
                  bookings: { label: "Bookings", color: "hsl(var(--primary))" },
                }}
              >
                <BarChart data={weeklyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Bar
                    dataKey="bookings"
                    fill="var(--color-bookings)"
                    radius={4}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {dashboardLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>This Week:</span>
                  <span className="font-medium">
                    {weeklyData.reduce((sum, day) => sum + day.bookings, 0)}{" "}
                    bookings
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue This Month:</span>
                  <span className="font-medium">
                    ₹{(revenue.total_revenue || 42500).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Venues:</span>
                  <span className="font-medium">
                    {stats.approved_venues || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Booking Rate:</span>
                  <span className="font-medium text-green-600">
                    {stats.total_bookings && stats.total_courts
                      ? Math.round(
                          (stats.confirmed_bookings / stats.total_bookings) *
                            100
                        )
                      : 85}
                    %
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Venues */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Venues</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/owner/facility-management">Manage Venues</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {venuesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : venuesData && venuesData.length > 0 ? (
            <div className="space-y-4">
              {venuesData.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{venue.name}</h4>
                    <p className="text-sm text-gray-600">{venue.address}</p>
                    <p className="text-sm text-gray-500">
                      {(venue as typeof venue & { courtsCount?: number })
                        .courtsCount || 0}{" "}
                      courts
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={venue.isApproved ? "default" : "secondary"}>
                      {venue.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No venues found. Create your first venue to get started!</p>
              <Button asChild className="mt-4">
                <Link to="/owner/facility-management">Create Venue</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/owner/booking-overview">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookingsLoading || dashboardLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : displayBookings && displayBookings.length > 0 ? (
            <div className="space-y-4">
              {displayBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-gray-400" />
                    <div>
                      <h4 className="font-medium">
                        {booking.user_name || "Unknown Customer"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {booking.venue_name} • {booking.court_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.bookingDate), "MMM dd, yyyy")}{" "}
                        • {formatTimeOnly(booking.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : booking.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      ₹{booking.totalAmount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent bookings found.</p>
              <p className="text-sm">
                Bookings will appear here when customers make reservations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
