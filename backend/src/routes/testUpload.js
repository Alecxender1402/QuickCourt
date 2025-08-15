import express from 'express';
import { uploadVenueImages } from '../config/cloudinary.js';

const router = express.Router();

// Test endpoint for image upload
router.post('/test-upload', uploadVenueImages.single('testImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload test error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

export default router;
