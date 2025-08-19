const express = require('express');
const router = express.Router();
const {
  registerUser,
  sendOTP,
  verifyOTP,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUsersByLocation,
  getFarmers
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.get('/location/:state/:district', getUsersByLocation);
router.get('/farmers', getFarmers);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Admin routes
router.get('/', protect, admin, getAllUsers);

module.exports = router;
