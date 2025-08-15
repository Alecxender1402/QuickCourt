import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useVenueReports,
  useUpdateReportStatus,
  useReportStats,
} from "@/services/adminService";
import { VenueReport, VenueReportStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  AlertTriangle,
  Eye,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";

const ReportsModeration: React.FC = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: "all" as VenueReportStatus | "all",
    search: "",
    sortBy: "createdAt" as "createdAt" | "status" | "reason",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<VenueReport | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<VenueReportStatus>("pending");

  const limit = 20;
  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useVenueReports({
    ...filters,
    limit,
    offset: page * limit,
  });

  const { data: stats } = useReportStats();
  const updateStatusMutation = useUpdateReportStatus();

  const handleStatusUpdate = async (
    reportId: number,
    status: VenueReportStatus,
    notes?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        reportId,
        data: { status, adminNotes: notes },
      });

      toast({
        title: "Report Updated",
        description: "Report status has been updated successfully.",
      });

      setSelectedReport(null);
      setAdminNotes("");
      refetch();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update report status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: VenueReportStatus) => {
    const variants = {
      pending: "outline",
      reviewed: "secondary",
      resolved: "default",
      dismissed: "secondary",
    } as const;

    const colors = {
      pending: "text-yellow-600 border-yellow-600",
      reviewed: "text-blue-600 border-blue-600",
      resolved: "text-green-600 border-green-600",
      dismissed: "text-gray-600 border-gray-600",
    };

    return (
      <Badge
        variant={variants[status] || "secondary"}
        className={colors[status]}
      >
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: VenueReportStatus) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "reviewed":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "dismissed":
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SEO
          title="Venue Reports - Admin"
          description="Manage venue reports submitted by users"
        />
        <PageHeader
          title="Venue Reports"
          subtitle="Manage venue reports submitted by users"
        />
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SEO
          title="Venue Reports - Admin"
          description="Manage venue reports submitted by users"
        />
        <PageHeader
          title="Venue Reports"
          subtitle="Manage venue reports submitted by users"
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load venue reports. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Venue Reports - Admin"
        description="Manage venue reports submitted by users"
      />

      <PageHeader
        title="Venue Reports"
        subtitle="Manage venue reports submitted by users"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_reports}</div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_reports}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.reviewed_reports}
              </div>
              <p className="text-sm text-muted-foreground">Reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.resolved_reports}
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {stats.dismissed_reports}
              </div>
              <p className="text-sm text-muted-foreground">Dismissed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Sort by:</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="reason">Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => handleFilterChange("sortOrder", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest</SelectItem>
                <SelectItem value="asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {reportsData?.items.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(report.status)}
                    {getStatusBadge(report.status)}
                    <span className="text-sm text-muted-foreground">
                      Report #{report.id} •{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold">{report.venue.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {report.venue.location} • Owner: {report.venue.owner_name}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-red-600 capitalize">
                      {report.reason.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm mt-1">{report.description}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      Reported by: {report.user.name} ({report.user.email})
                    </p>
                    {report.reviewed_at && (
                      <p>
                        Reviewed:{" "}
                        {new Date(report.reviewed_at).toLocaleDateString()} by{" "}
                        {report.reviewed_by}
                      </p>
                    )}
                  </div>

                  {report.admin_notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium">Admin Notes:</p>
                      <p className="text-sm">{report.admin_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setNewStatus(report.status);
                      setAdminNotes(report.admin_notes || "");
                    }}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {reportsData?.items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              There are no venue reports matching your filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {reportsData && reportsData.items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * limit + 1} to{" "}
            {Math.min((page + 1) * limit, reportsData.pagination.total)} of{" "}
            {reportsData.pagination.total} reports
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!reportsData.pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Update Report Status Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Report Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) =>
                    setNewStatus(value as VenueReportStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this report..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReport(null);
                    setAdminNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleStatusUpdate(selectedReport.id, newStatus, adminNotes)
                  }
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending
                    ? "Updating..."
                    : "Update Status"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsModeration;
