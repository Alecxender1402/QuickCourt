import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  Clock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { useToast } from "../../hooks/use-toast";
import { Court, Venue } from "../../lib/types";
import courtService, { CourtSearchParams } from "../../services/courtService";
import { useMyVenues } from "../../services/venueService";
import CourtForm from "../../components/owner/CourtForm";
import TimeSlotManagement from "../../components/owner/TimeSlotManagement";

const SPORT_TYPES = [
  "Football",
  "Basketball",
  "Tennis",
  "Badminton",
  "Cricket",
  "Swimming",
  "Table Tennis",
  "Volleyball",
  "Squash",
  "Hockey",
];

export default function CourtManagement() {
  const { toast } = useToast();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "sportType" | "pricePerHour" | "createdAt"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);

  // Time slot management state
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [timeSlotCourt, setTimeSlotCourt] = useState<Court | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourts, setTotalCourts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  // Venues for the dropdown in create/edit
  const { data: venues = [] } = useMyVenues();

  const fetchCourts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('Debug - Token exists:', !!token);
      console.log('Debug - User exists:', !!user);
      if (user) {
        const userData = JSON.parse(user);
        console.log('Debug - User role:', userData.role);
      }
      
      const params: CourtSearchParams = {
        search: searchTerm || undefined,
        sportType: sportFilter !== "all" ? sportFilter : undefined,
        isActive:
          statusFilter !== "all" ? statusFilter === "active" : undefined,
        sortBy,
        sortOrder,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      console.log('Debug - Making API call to getCourts with params:', params);
      const response = await courtService.getCourts(params);
      console.log('Debug - API response:', response);
      
      setCourts(response.items);
      setTotalCourts(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch courts:", error);
      
      // Check if it's an authentication error
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { status: number } };
        console.log('Debug - Error status:', axiosError.response?.status);
        if (axiosError.response?.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in again to access your courts",
            variant: "destructive",
          });
          return; // Don't show generic error message
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to load courts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    sportFilter,
    statusFilter,
    sortBy,
    sortOrder,
    toast,
  ]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleCreateCourt = () => {
    setEditingCourt(null);
    setShowCreateDialog(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowCreateDialog(true);
  };

  const handleTimeSlotManagement = (court: Court) => {
    setTimeSlotCourt(court);
    setShowTimeSlotDialog(true);
  };

  const handleDeleteCourt = (court: Court) => {
    setCourtToDelete(court);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCourt = async () => {
    if (!courtToDelete) return;

    try {
      await courtService.deleteCourt(courtToDelete.id);
      toast({
        title: "Success",
        description: "Court deleted successfully",
      });
      setShowDeleteDialog(false);
      setCourtToDelete(null);
      fetchCourts();
    } catch (error) {
      console.error("Failed to delete court:", error);
      toast({
        title: "Error",
        description: "Failed to delete court",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (court: Court) => {
    try {
      await courtService.toggleCourtStatus(court.id);
      toast({
        title: "Success",
        description: `Court ${
          court.isActive ? "deactivated" : "activated"
        } successfully`,
      });
      fetchCourts();
    } catch (error) {
      console.error("Failed to toggle court status:", error);
      toast({
        title: "Error",
        description: "Failed to update court status",
        variant: "destructive",
      });
    }
  };

  const handleCourtSaved = () => {
    setShowCreateDialog(false);
    setEditingCourt(null);
    fetchCourts();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSportFilter("all");
    setStatusFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your venue courts and their availability
          </p>
        </div>
        <Button
          onClick={handleCreateCourt}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Court
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Courts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalCourts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Courts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {courts.filter((court) => court.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inactive Courts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {courts.filter((court) => !court.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sport Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(courts.map((court) => court.sportType)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sport Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {SPORT_TYPES.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(
                  value as "name" | "sportType" | "pricePerHour" | "createdAt"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="sportType">Sport Type</SelectItem>
                <SelectItem value="pricePerHour">Price</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courts ({totalCourts})</CardTitle>
          <CardDescription>
            Manage your courts, pricing, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No courts found</p>
              <Button onClick={handleCreateCourt} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Court
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Court Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Venue
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Sport Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Price/Hour
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Capacity
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courts.map((court) => (
                    <tr
                      key={court.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {court.name}
                          </div>
                          {court.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {court.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {court.venue?.name || "Unknown Venue"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{court.sportType}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        ₹{court.pricePerHour}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {court.capacity} players
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={court.isActive ? "default" : "secondary"}
                        >
                          {court.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCourt(court)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTimeSlotManagement(court)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Manage Time Slots"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(court)}
                            className={
                              court.isActive
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {court.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCourt(court)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCourts)} of{" "}
                {totalCourts} courts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Court Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourt ? "Edit Court" : "Add New Court"}
            </DialogTitle>
            <DialogDescription>
              {editingCourt
                ? "Update court details and settings"
                : "Create a new court for your venue"}
            </DialogDescription>
          </DialogHeader>
          <CourtForm
            court={editingCourt}
            venues={venues}
            onSave={handleCourtSaved}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Court</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courtToDelete?.name}"? This
              action cannot be undone and will cancel all future bookings for
              this court.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCourt}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Court
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Slot Management Dialog */}
      <Dialog open={showTimeSlotDialog} onOpenChange={setShowTimeSlotDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Time Slots - {timeSlotCourt?.name}
            </DialogTitle>
            <DialogDescription>
              Configure available time slots for {timeSlotCourt?.sportType} court
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {timeSlotCourt && (
              <TimeSlotManagement
                court={timeSlotCourt}
                onClose={() => {
                  setShowTimeSlotDialog(false);
                  setTimeSlotCourt(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
