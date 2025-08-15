import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';

// Create payment intent (simplified)
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId: userId,
        status: 'pending',
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be paid',
      });
    }

    // Create payment intent record
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        currency: 'usd',
        status: 'pending',
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: `pi_${paymentIntent.id}_secret`,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

// Confirm payment (simplified)
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Update payment intent
    const paymentIntent = await prisma.paymentIntent.update({
      where: { id: parseInt(paymentIntentId) },
      data: {
        status: 'succeeded',
        paidAt: new Date(),
      },
      include: {
        booking: true,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: paymentIntent.bookingId },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: paymentIntent,
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

// Get payment history (simplified)
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const payments = await prisma.paymentIntent.findMany({
      where: {
        booking: {
          userId: userId,
        },
      },
      include: {
        booking: {
          include: {
            court: {
              select: {
                name: true,
              },
            },
            venue: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.paymentIntent.count({
      where: {
        booking: {
          userId: userId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

// Request refund (simplified)
export const requestRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId: userId,
        status: 'confirmed',
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not eligible for refund',
      });
    }

    // Create refund request
    const refund = await prisma.refund.create({
      data: {
        bookingId: parseInt(bookingId),
        amount: booking.totalAmount,
        reason: reason || 'Customer requested',
        status: 'pending',
      },
    });

    res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: refund,
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request refund',
      error: error.message,
    });
  }
};
