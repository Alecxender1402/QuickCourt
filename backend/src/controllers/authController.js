import UserPrisma from '../models/User.js';
import jwt from 'jsonwebtoken';
import emailService from '../services/emailService.js';
import tempUserStorage from '../services/tempUserStorage.js';
import prisma from '../config/prisma.js';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Check if user already exists in database
    const existingUser = await UserPrisma.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store user data temporarily (not in database yet)
    const tempUserData = {
      name,
      email,
      password,
      role,
    };

    tempUserStorage.store(email, tempUserData, otpCode);

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, name, otpCode);
      console.log('✅ OTP Email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      // Continue with registration even if email fails
      console.log('📧 OTP Code (email failed):', otpCode);
    }

    res.status(200).json({
      success: true,
      message:
        'Registration initiated. Please check your email for OTP verification to complete registration.',
      data: {
        email: email,
        message: 'OTP sent to email. Verify to complete registration.',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required',
      });
    }

    // Verify OTP from temporary storage
    let tempUserData;
    try {
      tempUserData = tempUserStorage.verifyOTP(email, otpCode);
    } catch (tempError) {
      return res.status(400).json({
        success: false,
        message: tempError.message,
      });
    }

    // Check if user was created in the meantime
    const existingUser = await UserPrisma.findByEmail(email);
    if (existingUser) {
      // Clean up temporary data
      tempUserStorage.remove(email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user in database
    const user = await UserPrisma.create({
      name: tempUserData.name,
      email: tempUserData.email,
      password: tempUserData.password,
      role: tempUserData.role,
      isVerified: true,
    });

    // Clean up temporary data
    tempUserStorage.remove(email);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered and verified successfully',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user already exists
    const existingUser = await UserPrisma.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Check if there's temporary data for this email
    if (!tempUserStorage.hasTempUser(email)) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email',
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update OTP in temporary storage
    tempUserStorage.updateOTP(email, otpCode);

    // Send OTP email
    try {
      const tempUserData = tempUserStorage.get(email);
      await emailService.sendOTPEmail(email, tempUserData.name, otpCode);
      console.log('✅ OTP Email resent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      console.log('📧 OTP Code (email failed):', otpCode);
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await UserPrisma.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    // Check if user is suspended
    if (user.suspendedAt) {
      return res.status(401).json({
        success: false,
        message: user.suspensionReason || 'Your account has been suspended',
      });
    }

    // Verify password
    const isValidPassword = await UserPrisma.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await UserPrisma.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, phone } = req.body;

    const user = await UserPrisma.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updatedUser = await user.update({
      name: name || user.name,
      avatar: avatar !== undefined ? avatar : user.avatar,
      phone: phone !== undefined ? phone : user.phone,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user = await UserPrisma.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isValidPassword = await UserPrisma.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedNewPassword = await UserPrisma.hashPassword(newPassword);

    // Update password
    await user.update({
      password: hashedNewPassword,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user by email
    const user = await UserPrisma.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token temporarily
    tempUserStorage.storeResetToken(email, resetToken, resetTokenExpiry);

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, user.name, resetToken);
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      console.log('🔗 Reset Token (email failed):', resetToken);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    // Verify reset token
    let email;
    try {
      email = tempUserStorage.verifyResetToken(token);
    } catch (tempError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Find user
    const user = await UserPrisma.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Hash new password
    const hashedPassword = await UserPrisma.hashPassword(password);

    // Update password
    await user.update({
      password: hashedPassword,
    });

    // Clean up reset token
    tempUserStorage.removeResetToken(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [totalBookings, upcomingBookings, completedBookings, cancelledBookings] =
      await Promise.all([
        prisma.booking.count({
          where: { userId: userId },
        }),
        prisma.booking.count({
          where: {
            userId: userId,
            status: 'confirmed',
            bookingDate: {
              gte: new Date(),
            },
          },
        }),
        prisma.booking.count({
          where: {
            userId: userId,
            status: 'completed',
          },
        }),
        prisma.booking.count({
          where: {
            userId: userId,
            status: 'cancelled',
          },
        }),
      ]);

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics',
    });
  }
};
