import stripe from '../config/stripe.js';
import prisma from '../config/prisma.js';
import emailService from '../services/emailService.js';

// Create Stripe Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    console.log('Received checkout request body:', JSON.stringify(req.body, null, 2));
    
    const { amount, currency = 'inr', bookingData, successUrl, cancelUrl } = req.body;
    const userId = req.user.id; // Now we have real authentication

    // Validate booking data
    const venue = await prisma.venue.findUnique({
      where: { id: parseInt(bookingData.venueId) },
      include: { courts: true }
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const court = venue.courts.find(c => c.id === parseInt(bookingData.courtId));
    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Court not found'
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Court Booking - ${court.name}`,
              description: `${venue.name} - ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}`,
            },
            unit_amount: parseInt(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        venueId: bookingData.venueId.toString(),
        courtId: bookingData.courtId.toString(),
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        notes: bookingData.notes || '',
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
};

// Handle successful payment from Stripe Checkout
export const handleCheckoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Create booking in database
      const metadata = session.metadata;
      
      // Convert time strings to proper DateTime format
      const bookingDate = new Date(metadata.date);
      const startDateTime = new Date(`1970-01-01T${metadata.startTime}:00.000Z`);
      const endDateTime = new Date(`1970-01-01T${metadata.endTime}:00.000Z`);
      
      const booking = await prisma.booking.create({
        data: {
          userId: parseInt(metadata.userId),
          venueId: parseInt(metadata.venueId),
          courtId: parseInt(metadata.courtId),
          bookingDate: bookingDate,
          startTime: startDateTime,
          endTime: endDateTime,
          notes: metadata.notes || '',
          totalAmount: session.amount_total / 100, // Convert from paise to rupees
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentId: session.payment_intent,
          confirmedAt: new Date(),
        },
        include: {
          user: true,
          venue: true,
          court: true,
        }
      });

      // Send confirmation email
      try {
        await emailService.sendBookingConfirmationEmail(booking);
        console.log('Booking confirmation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the booking creation if email fails
      }

      // Send payment success email
      try {
        await emailService.sendPaymentSuccessEmail(
          booking.user.email,
          {
            bookingId: booking.id,
            amount: booking.totalAmount,
            paymentMethod: 'Stripe',
            customerName: booking.user.name,
            transactionId: session.payment_intent,
          }
        );
        console.log('Payment success email sent successfully');
      } catch (emailError) {
        console.error('Failed to send payment success email:', emailError);
      }

      // Format time fields for frontend display
      const formattedBooking = {
        ...booking,
        startTime: `${booking.startTime.getUTCHours().toString().padStart(2, '0')}:${booking.startTime.getUTCMinutes().toString().padStart(2, '0')}`,
        endTime: `${booking.endTime.getUTCHours().toString().padStart(2, '0')}:${booking.endTime.getUTCMinutes().toString().padStart(2, '0')}`,
      };

      res.json({
        success: true,
        message: 'Booking created successfully',
        booking: formattedBooking
      });
    } else {
      // Payment not completed - send failure email if we have user info
      if (session.metadata && session.metadata.userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(session.metadata.userId) }
        });
        
        if (user) {
          await emailService.sendPaymentFailureEmail(user.email, {
            amount: session.amount_total / 100,
            reason: 'Payment not completed or failed',
          });
        }
      }

      res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

  } catch (error) {
    console.error('Error handling checkout success:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process successful payment',
      error: error.message
    });
  }
};

// Create payment intent for booking
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'inr', bookingData } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Convert amount to smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: currency,
      metadata: {
        userId: userId.toString(),
        venueId: bookingData?.venueId?.toString() || '',
        courtId: bookingData?.courtId?.toString() || '',
        bookingDate: bookingData?.bookingDate || '',
        startTime: bookingData?.startTime || '',
        endTime: bookingData?.endTime || ''
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Confirm payment and create booking
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;
    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Create booking after successful payment
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        venueId: parseInt(bookingData.venueId),
        courtId: parseInt(bookingData.courtId),
        bookingDate: new Date(bookingData.bookingDate),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        totalAmount: paymentIntent.amount / 100, // Convert back from paise
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentId: paymentIntentId,
        notes: bookingData.notes || ''
      },
      include: {
        venue: true,
        court: true,
        user: true
      }
    });

    res.json({
      success: true,
      message: 'Payment confirmed and booking created',
      data: {
        booking,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100
        }
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Stripe publishable key
export const getStripeConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  } catch (error) {
    console.error('Get Stripe config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Stripe configuration'
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'User cancellation' } = req.body;
    const userId = req.user?.id;

    // Find booking with relations
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        ...(userId && { userId: userId }), // Only check user ownership if user is authenticated
      },
      include: {
        user: true,
        venue: true,
        court: true,
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to cancel it'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        user: true,
        venue: true,
        court: true,
      }
    });

    // Send cancellation email
    await emailService.sendBookingCancellationEmail(updatedBooking, reason);

    // Send payment failure email for cancelled payment
    if (booking.paymentStatus === 'paid') {
      await emailService.sendPaymentFailureEmail(booking.user.email, {
        amount: booking.totalAmount,
        reason: 'Booking cancelled - Refund will be processed',
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};
