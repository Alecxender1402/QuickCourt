import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import ReportVenueModal from "./ReportVenueModal";

interface ReportVenueButtonProps {
  venueId: number;
  venueName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const ReportVenueButton: React.FC<ReportVenueButtonProps> = ({
  venueId,
  venueName,
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Flag className="h-4 w-4" />
        Report
      </Button>

      <ReportVenueModal
        venueId={venueId}
        venueName={venueName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ReportVenueButton;
