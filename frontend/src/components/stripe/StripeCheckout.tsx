import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeCheckoutProps {
  amount: number;
  bookingData: {
    venueId: number;
    courtId: number;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  bookingData,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to complete your booking');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const requestData = {
        amount: amount * 100, // Convert to paise
        currency: 'inr',
        bookingData,
        successUrl: `http://localhost:8080/booking-success`,
        cancelUrl: `http://localhost:8080/booking-cancelled`,
      };
      
      // Debug logging
      console.log('Sending checkout request data:', requestData);
      
      // Create checkout session
      const response = await fetch('http://localhost:3000/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      
      // Debug logging
      console.log('Checkout response status:', response.status);
      console.log('Checkout response data:', responseData);
      
      if (!response.ok) {
        // Log validation errors for debugging
        if (responseData.errors) {
          console.log('Validation errors:', responseData.errors);
        }
        throw new Error(responseData.message || 'Failed to create checkout session');
      }

      const { sessionId } = responseData;

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        throw new Error(error.message || 'Checkout failed');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
        <p className="text-sm text-gray-600">
          Amount: ₹{amount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          You will be redirected to Stripe's secure payment page
        </p>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to Stripe...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ₹{amount.toFixed(2)} with Stripe
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
