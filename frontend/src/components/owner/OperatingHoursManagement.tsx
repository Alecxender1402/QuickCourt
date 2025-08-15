import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Loader2, Clock, Save } from 'lucide-react';

interface OperatingHours {
  id?: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

interface OperatingHoursManagementProps {
  venueId: number;
}

const daysOfWeek = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const OperatingHoursManagement: React.FC<OperatingHoursManagementProps> = ({ venueId }) => {
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize default operating hours
  const initializeDefaultHours = () => {
    return daysOfWeek.map((_, index) => ({
      dayOfWeek: index,
      openTime: '09:00',
      closeTime: '21:00',
      isOpen: index >= 1 && index <= 5 // Monday to Friday open by default
    }));
  };

  useEffect(() => {
    fetchOperatingHours();
  }, [venueId]);

  const fetchOperatingHours = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/operating-hours/venues/${venueId}/operating-hours`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setOperatingHours(data.data);
        } else {
          // Initialize with default hours if none exist
          setOperatingHours(initializeDefaultHours());
        }
      } else {
        throw new Error('Failed to fetch operating hours');
      }
    } catch (error) {
      console.error('Error fetching operating hours:', error);
      // Initialize with default hours on error
      setOperatingHours(initializeDefaultHours());
      toast({
        title: "Error",
        description: "Failed to load operating hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev => 
      prev.map(hours => 
        hours.dayOfWeek === dayOfWeek 
          ? { ...hours, [field]: value }
          : hours
      )
    );
  };

  const handleToggleOpen = (dayOfWeek: number, isOpen: boolean) => {
    setOperatingHours(prev => 
      prev.map(hours => 
        hours.dayOfWeek === dayOfWeek 
          ? { ...hours, isOpen }
          : hours
      )
    );
  };

  const validateHours = () => {
    for (const hours of operatingHours) {
      if (hours.isOpen) {
        if (!hours.openTime || !hours.closeTime) {
          toast({
            title: "Validation Error",
            description: `Please set both open and close times for ${daysOfWeek[hours.dayOfWeek]}`,
            variant: "destructive"
          });
          return false;
        }
        
        const openTime = new Date(`2000-01-01 ${hours.openTime}`);
        const closeTime = new Date(`2000-01-01 ${hours.closeTime}`);
        
        if (openTime >= closeTime) {
          toast({
            title: "Validation Error",
            description: `Close time must be after open time for ${daysOfWeek[hours.dayOfWeek]}`,
            variant: "destructive"
          });
          return false;
        }
      }
    }
    return true;
  };

  const saveOperatingHours = async () => {
    if (!validateHours()) {
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/operating-hours/venues/${venueId}/operating-hours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operatingHours: operatingHours
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Operating hours saved successfully!"
        });
        fetchOperatingHours(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to save operating hours');
      }
    } catch (error) {
      console.error('Error saving operating hours:', error);
      toast({
        title: "Error",
        description: "Failed to save operating hours",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading operating hours...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Operating Hours
        </CardTitle>
        <p className="text-sm text-gray-600">
          Set your venue's operating hours. Users can only book within these hours.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {operatingHours.map((hours) => (
          <div key={hours.dayOfWeek} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-24 font-medium">
              {daysOfWeek[hours.dayOfWeek]}
            </div>
            
            <Switch
              checked={hours.isOpen}
              onCheckedChange={(checked) => handleToggleOpen(hours.dayOfWeek, checked)}
              className="ml-4"
            />
            
            {hours.isOpen ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Open:</label>
                  <Input
                    type="time"
                    value={hours.openTime}
                    onChange={(e) => handleTimeChange(hours.dayOfWeek, 'openTime', e.target.value)}
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Close:</label>
                  <Input
                    type="time"
                    value={hours.closeTime}
                    onChange={(e) => handleTimeChange(hours.dayOfWeek, 'closeTime', e.target.value)}
                    className="w-32"
                  />
                </div>
              </>
            ) : (
              <span className="text-gray-500 italic ml-4">Closed</span>
            )}
          </div>
        ))}
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={saveOperatingHours}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Operating Hours'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperatingHoursManagement;
