import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Bell, Calendar, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/services/authService";
import { useUnreadNotificationCount } from "@/services/notificationService";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationCount({
    enabled: false, // Disabled for now
  });
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        authLogout(); // Update auth context state
        navigate("/");
      },
      onError: () => {
        // Even if server logout fails, clear local state
        authLogout();
        navigate("/");
      },
    });
  };

  // Get the home URL based on user role
  const getHomeUrl = () => {
    if (!isAuthenticated || !user) return "/";

    switch (user.role) {
      case "facility_owner":
        return "/owner/dashboard";
      case "admin":
        return "/admin/dashboard";
      case "user":
      default:
        return "/";
    }
  };
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={getHomeUrl()} className="flex items-center space-x-2">
          <div className="font-bold text-xl text-primary">QuickCourt</div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && user ? (
            // Role-based navigation
            user.role === "facility_owner" ? (
              <>
                <Link
                  to="/owner/venues"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-bold">My Venues</span>
                </Link>
                <Link
                  to="/owner/courts"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <Building className="h-4 w-4" />
                  <span className="font-bold">Courts</span>
                </Link>
                <Link
                  to="/owner/bookings"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-bold">Bookings</span>
                </Link>
              </>
            ) : user.role === "admin" ? (
              <>
                <Link
                  to="/admin/facilities"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-bold">Facilities</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="font-bold">Users</span>
                </Link>
                <Link
                  to="/admin/reports"
                  className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
                >
                  <Bell className="h-4 w-4" />
                  <span className="font-bold">Reports</span>
                </Link>
              </>
            ) : (
              // Regular user navigation
              <Link
                to="/venues"
                className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="font-bold">Book</span>
              </Link>
            )
          ) : (
            // Not authenticated navigation
            <Link
              to="/venues"
              className="text-foreground/60 hover:text-foreground transition-colors flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="font-bold">Book</span>
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Notifications - Only for admin and facility owners
              {(user?.role === "admin" || user?.role === "facility_owner") && (
                // <Button variant="ghost" size="sm" className="relative" asChild>
                //   <Link to="/notifications">
                //     <Bell className="h-4 w-4" />
                //     {unreadCount > 0 && (
                //       <Badge
                //         variant="destructive"
                //         className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                //       >
                //         {unreadCount > 99 ? "99+" : unreadCount}
                //       </Badge>
                //     )}
                //   </Link>
                // </Button>
              )} */}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.name || "Profile"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 space-y-4">
            {isAuthenticated && user ? (
              // Role-based mobile navigation
              user.role === "facility_owner" ? (
                <>
                  <Link
                    to="/owner/venues"
                    className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-bold">My Venues</span>
                  </Link>
                  <Link
                    to="/owner/bookings"
                    className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-bold">Bookings</span>
                  </Link>
                </>
              ) : user.role === "admin" ? (
                <>
                  <Link
                    to="/admin/venues"
                    className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="font-bold">Manage Venues</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-bold">Users</span>
                  </Link>
                </>
              ) : (
                // Regular user mobile navigation
                <Link
                  to="/venues"
                  className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="font-bold">Book</span>
                </Link>
              )
            ) : (
              // Not authenticated mobile navigation
              <Link
                to="/venues"
                className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-bold">Book</span>
              </Link>
            )}
            <div className="pt-4 border-t space-y-2">
              {isAuthenticated ? (
                <>
                  {/* Notifications - Only for admin and facility owners */}
                  {(user?.role === "admin" ||
                    user?.role === "facility_owner") && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        to="/notifications"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
