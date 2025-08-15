import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitVenueReport } from "@/services/reportService";
import { SubmitVenueReportRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Flag, X } from "lucide-react";

interface ReportVenueModalProps {
  venueId: number;
  venueName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportVenueModal: React.FC<ReportVenueModalProps> = ({
  venueId,
  venueName,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SubmitVenueReportRequest>({
    reason: "inappropriate_content",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitReportMutation = useSubmitVenueReport();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason) {
      newErrors.reason = "Please select a reason for reporting";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please provide a description";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await submitReportMutation.mutateAsync({
        venueId,
        data: formData,
      });

      toast({
        title: "Report Submitted",
        description:
          "Your report has been submitted successfully. We will review it shortly.",
      });

      onClose();
      setFormData({
        reason: "inappropriate_content",
        description: "",
      });
      setErrors({});
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again.";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const reasonOptions = [
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "false_information", label: "False Information" },
    { value: "safety_concerns", label: "Safety Concerns" },
    { value: "poor_service", label: "Poor Service" },
    { value: "facility_issues", label: "Facility Issues" },
    { value: "other", label: "Other" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Venue
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Venue</Label>
              <p className="text-sm text-muted-foreground">{venueName}</p>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Report</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    reason: value as SubmitVenueReportRequest["reason"],
                  }))
                }
              >
                <SelectTrigger
                  className={errors.reason ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="text-sm text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Please provide details about the issue..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
                <p className="text-sm text-muted-foreground ml-auto">
                  {formData.description.length}/1000
                </p>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Reports are reviewed by our admin team. False reports may result
                in account suspension.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitReportMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitReportMutation.isPending
                  ? "Submitting..."
                  : "Submit Report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportVenueModal;
