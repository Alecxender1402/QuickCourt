import SEO from "@/components/SEO";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Building,
  MapPin,
  Star,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Database,
} from "lucide-react";

const FacilityProvider = () => {
  return (
    <div className="container py-10">
      <SEO
        title="Facility Providers – QuickCourt"
        description="Manage and view facility providers on the platform."
      />
      <PageHeader title="Facility Providers" />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Facility Provider Management
            </h2>
            <p className="text-gray-600">
              View and manage venue owners and providers
            </p>
          </div>
        </div>
      </div>

      {/* Feature Implementation Notice */}
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium mb-4">
            Provider Management Available in User Management
          </h3>
          <div className="space-y-3 text-sm max-w-md mx-auto">
            <p>
              Facility provider management is handled through the User
              Management section.
            </p>
            <p>
              You can view and manage facility owners by filtering for "Facility
              Owner" role in User Management.
            </p>
            <div className="mt-6">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="/admin/users">Go to User Management</a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Active Venues</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacilityProvider;
