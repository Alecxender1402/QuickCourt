import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController.js';
import { userValidation, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', userValidation.register, handleValidationErrors, register);
router.post('/login', userValidation.login, handleValidationErrors, login);
router.post('/verify-otp', userValidation.verifyOTP, handleValidationErrors, verifyOTP);
router.post('/resend-otp', userValidation.resendOTP, handleValidationErrors, resendOTP);
router.post(
  '/forgot-password',
  userValidation.forgotPassword,
  handleValidationErrors,
  forgotPassword
);
router.post('/reset-password', userValidation.resetPassword, handleValidationErrors, resetPassword);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.get('/profile', authenticateToken, getProfile);
router.put(
  '/profile',
  authenticateToken,
  userValidation.updateProfile,
  handleValidationErrors,
  updateProfile
);
router.put(
  '/change-password',
  authenticateToken,
  userValidation.changePassword,
  handleValidationErrors,
  changePassword
);
router.post('/logout', authenticateToken, logout);

export default router;
