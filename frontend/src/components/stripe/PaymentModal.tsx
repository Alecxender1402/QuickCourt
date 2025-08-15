import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { StripeCheckout } from './StripeCheckout';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingData: {
    venueId: number;
    courtId: number;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  };
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const handleSuccess = () => {
    onPaymentSuccess({ success: true });
    onClose();
  };

  const handleError = (error: string) => {
    onPaymentError(error);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <StripeCheckout
          amount={amount}
          bookingData={bookingData}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </DialogContent>
    </Dialog>
  );
};
