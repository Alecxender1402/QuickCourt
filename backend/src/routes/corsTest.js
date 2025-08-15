import express from 'express';

const router = express.Router();

// Test CORS endpoint
router.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working for GET requests',
    origin: req.headers.origin,
    method: req.method
  });
});

router.post('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working for POST requests',
    origin: req.headers.origin,
    method: req.method
  });
});

router.patch('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working for PATCH requests',
    origin: req.headers.origin,
    method: req.method
  });
});

router.options('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS preflight working',
    origin: req.headers.origin,
    method: req.method
  });
});

export default router;
