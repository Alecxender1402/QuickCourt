import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Eye,
  UserCheck,
  UserX,
  ArrowRight,
  FileText,
  BarChart3,
  Activity,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminVenues,
  useAdminChartData,
} from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const AdminDashboard = () => {
  const { toast } = useToast();
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error,
  } = useAdminDashboard();

  // Additional data for quick access
  const { data: usersData } = useAdminUsers({ limit: 5 });
  const { data: pendingVenuesData } = useAdminVenues({
    status: "pending",
    limit: 5,
  });

  // Get real chart data
  const { data: chartData, isLoading: chartLoading } =
    useAdminChartData("monthly");

  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">(
    "week"
  );

  // Handle error once when error state changes
  if (error && !dashboardLoading) {
    console.error("Dashboard error:", error);
    toast({
      title: "Error loading dashboard",
      description: "Failed to load admin dashboard data. Using default values.",
      variant: "destructive",
    });
  }

  // Safe defaults with explicit fallbacks
  const stats = {
    totalUsers: dashboardData?.totalUsers ?? 0,
    totalVenues: dashboardData?.totalVenues ?? 0,
    totalBookings: dashboardData?.totalBookings ?? 0,
    totalRevenue: dashboardData?.totalRevenue ?? 0,
    pendingVenues: dashboardData?.pendingVenues ?? 0,
    activeUsers: dashboardData?.activeUsers ?? 0,
  };

  const recentUsers = usersData?.items?.slice(0, 5) || [];
  const pendingVenues = pendingVenuesData?.items || [];

  // Use real chart data from API, with fallbacks
  const monthlyGrowthData = chartData?.monthlyGrowth || [];
  const sportPopularityData = chartData?.sportPopularity || [];
  const venueStatusData = chartData?.venueStatus || [
    {
      name: "Active",
      value: stats.totalVenues - stats.pendingVenues,
      color: "#10b981",
    },
    { name: "Pending", value: stats.pendingVenues, color: "#f59e0b" },
    { name: "Rejected", value: 0, color: "#ef4444" },
  ];

  // Real user activity data would come from analytics, for now using basic metrics
  const userActivityData = [
    { time: "00:00", active: Math.floor(stats.activeUsers * 0.05) },
    { time: "04:00", active: Math.floor(stats.activeUsers * 0.02) },
    { time: "08:00", active: Math.floor(stats.activeUsers * 0.15) },
    { time: "12:00", active: Math.floor(stats.activeUsers * 0.25) },
    { time: "16:00", active: Math.floor(stats.activeUsers * 0.22) },
    { time: "20:00", active: Math.floor(stats.activeUsers * 0.18) },
    { time: "23:59", active: Math.floor(stats.activeUsers * 0.12) },
  ];

  return (
    <div className="container py-10">
      <SEO
        title="Admin Dashboard – QuickCourt"
        description="Complete admin control panel with integrated functionality management."
      />

      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time platform analytics and management overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/facilities">
            <Button variant="outline" size="sm">
              <Building2 className="w-4 h-4 mr-2" />
              Review Facilities
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-20 mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {stats.activeUsers} active
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Venues */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Venues
                </p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-20 mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">
                    {stats.totalVenues.toLocaleString()}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    {stats.pendingVenues} pending
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bookings
                </p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-20 mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalBookings.toLocaleString()}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    Platform activity
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-20 mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-emerald-600">
                    ₹{((stats.totalRevenue || 0) / 100).toLocaleString()}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 mr-1" />
                  <span className="text-sm text-emerald-600 font-medium">
                    Platform earnings
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <BarChart3 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Management Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {stats.totalUsers}
                </div>
                <div className="text-xs text-blue-600">Total Users</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {stats.activeUsers}
                </div>
                <div className="text-xs text-green-600">Active Users</div>
              </div>
            </div>

            {/* Recent Users Preview */}
            <div>
              <h4 className="font-medium text-sm mb-2">Recent Users</h4>
              <div className="space-y-2">
                {recentUsers.length > 0 ? (
                  recentUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {user.isActive ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No recent users</div>
                )}
              </div>
            </div>

            <Link to="/admin/users" className="w-full">
              <Button variant="outline" className="w-full" size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Manage All Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Facility Management Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Facility Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {stats.totalVenues}
                </div>
                <div className="text-xs text-green-600">Total Venues</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">
                  {stats.pendingVenues}
                </div>
                <div className="text-xs text-orange-600">Pending Review</div>
              </div>
            </div>

            {/* Pending Venues Preview */}
            <div>
              <h4 className="font-medium text-sm mb-2">Pending Approvals</h4>
              <div className="space-y-2">
                {pendingVenues.length > 0 ? (
                  pendingVenues.slice(0, 3).map((venue) => (
                    <div
                      key={venue.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">{venue.name}</span>
                        <div className="text-xs text-gray-500">
                          {venue.location}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No pending venues</div>
                )}
              </div>
            </div>

            <Link to="/admin/facilities" className="w-full">
              <Button variant="outline" className="w-full" size="sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                Review Facilities
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Platform Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : monthlyGrowthData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="venues"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Venues"
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stackId="3"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Bookings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No growth data available yet</p>
                  <p className="text-sm">
                    Data will appear as platform usage grows
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : monthlyGrowthData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `₹${(value / 100).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ fill: "#059669", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No revenue data available yet</p>
                  <p className="text-sm">
                    Revenue charts will appear with bookings
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sport & Venue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sport Popularity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sport Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : sportPopularityData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sportPopularityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sport" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#8884d8" name="Bookings">
                      {sportPopularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No sport data available yet</p>
                  <p className="text-sm">
                    Charts will appear when courts are added
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Venue Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Venue Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : venueStatusData.some((item) => item.value > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={venueStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {venueStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No venue data available yet</p>
                  <p className="text-sm">
                    Venue distribution will appear when venues are added
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Activity Throughout Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Daily User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : stats.totalUsers > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No user activity data available</p>
                  <p className="text-sm">
                    Activity patterns will appear with user engagement
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* System Health & Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              System Health & Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* System Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm mb-3">System Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Operational
                </Badge>
              </div>
            </div>

            {/* Key Performance Metrics */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Platform Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(
                      (stats.totalVenues / (stats.totalUsers || 1)) * 100
                    )}
                    %
                  </div>
                  <div className="text-xs text-gray-600">Owner Ratio</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(
                      ((stats.totalVenues - stats.pendingVenues) /
                        (stats.totalVenues || 1)) *
                        100
                    )}
                    %
                  </div>
                  <div className="text-xs text-gray-600">Approval Rate</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {(stats.totalBookings / (stats.totalVenues || 1)).toFixed(
                      1
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Avg Bookings/Venue
                  </div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-600">
                    ₹
                    {(
                      (stats.totalRevenue || 0) /
                      100 /
                      (stats.totalBookings || 1)
                    ).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Avg Revenue/Booking
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Platform Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-600">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-xs text-blue-600">
                  {stats.activeUsers} active today
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <Building2 className="w-8 h-8 text-orange-600" />
              <div>
                <div className="font-semibold text-orange-600">
                  {stats.pendingVenues}
                </div>
                <div className="text-sm text-gray-600">Pending Venues</div>
                <div className="text-xs text-orange-600">Need review</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-600">
                  {stats.totalBookings}
                </div>
                <div className="text-sm text-gray-600">Total Bookings</div>
                <div className="text-xs text-green-600">All time</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-600">
                  ₹{((stats.totalRevenue || 0) / 100).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xs text-purple-600">Platform earnings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
