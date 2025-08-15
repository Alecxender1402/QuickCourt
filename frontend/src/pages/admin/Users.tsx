import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCheck,
  UserX,
  Search,
  Shield,
  Building,
  User as UserIcon,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useUpdateUserStatus } from "@/services/adminService";
import { User, UserRole } from "@/lib/types";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();

  // API hooks
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useAdminUsers({
    search: searchTerm,
    role: roleFilter === "all" ? undefined : (roleFilter as UserRole),
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "active" | "suspended"),
    limit: 50,
    offset: 0,
  });

  const updateUserStatusMutation = useUpdateUserStatus();

  const users = usersData?.items || [];
  const totalCount = usersData?.pagination?.total || 0;

  const handleSuspendUser = async (userId: number, userName: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        data: { action: "suspend", reason: "Suspended by admin" },
      });
      toast({
        title: "User suspended",
        description: `${userName} has been suspended successfully.`,
        variant: "destructive",
      });
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to suspend user";
      toast({
        title: "Error suspending user",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleActivateUser = async (userId: number, userName: string) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        data: { action: "activate", reason: "Activated by admin" },
      });
      toast({
        title: "User activated",
        description: `${userName} has been activated successfully.`,
      });
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate user";
      toast({
        title: "Error activating user",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "facility_owner":
        return <Building className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "facility_owner":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "destructive";
  };

  return (
    <div className="container py-10">
      <SEO
        title="User Management – QuickCourt"
        description="Manage users, facility owners, and administrators."
      />
      <PageHeader title="User Management" />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">All Users ({totalCount})</h2>
            <p className="text-gray-600">
              Manage users, facility owners, and their account status
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">👥 All Roles</SelectItem>
              <SelectItem value="user">👤 Users</SelectItem>
              <SelectItem value="facility_owner">🏢 Facility Owners</SelectItem>
              <SelectItem value="admin">🛡️ Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📊 All Status</SelectItem>
              <SelectItem value="active">✅ Active</SelectItem>
              <SelectItem value="inactive">❌ Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading
          ? // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </Card>
            ))
          : users.map((user: User) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">
                              {user.role.replace("_", " ")}
                            </span>
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(user.isActive)}>
                            {user.isActive ? "✅ Active" : "❌ Suspended"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Joined:{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* User Stats */}
                        <div className="flex gap-4 mt-3 text-xs">
                          {user.role === "facility_owner" && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              🏢 Facilities
                            </span>
                          )}
                          {user.role === "user" && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              📅 Customer
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            ID: #{user.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {user.role !== "admin" && (
                      <div className="flex flex-col gap-2">
                        {user.isActive ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <UserX className="w-4 h-4 mr-1" />
                                Suspend
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Suspend User
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to suspend "{user.name}
                                  "? This will prevent them from accessing the
                                  platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleSuspendUser(user.id, user.name)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Suspend User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserCheck className="w-4 h-4 mr-1" />
                                Activate
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Activate User
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to activate "{user.name}
                                  "? This will restore their access to the
                                  platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleActivateUser(user.id, user.name)
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Activate User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

        {!isLoading && users.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p>No users match the current filter criteria.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Users;
