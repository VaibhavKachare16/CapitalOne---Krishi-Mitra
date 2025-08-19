const User = require('../models/User');
const UserMapping = require('../models/UserMapping');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      aadharNumber,
      firstName,
      lastName,
      email,
      phoneNumber,
      userType,
      location,
      farmDetails
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { aadharNumber: aadharNumber.replace(/\s/g, '') },
        { email: email.toLowerCase() },
        { phoneNumber: phoneNumber.replace(/\s/g, '') }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this Aadhar number, email, or phone number'
      });
    }

    // Create new user
    const user = await User.create({
      aadharNumber,
      firstName,
      lastName,
      email,
      phoneNumber,
      userType,
      location,
      farmDetails
    });

    if (user) {
      const token = generateToken(user._id);
      
      res.status(201).json({
        _id: user._id,
        aadharNumber: user.formattedAadhar,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        location: user.location,
        isVerified: user.isVerified,
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Send OTP for Aadhar number
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { aadharNumber } = req.body;

    if (!aadharNumber) {
      return res.status(400).json({
        message: 'Aadhar number is required'
      });
    }

    // Clean Aadhar number
    const cleanAadhar = aadharNumber.replace(/\s/g, '');

    // Validate Aadhar format
    if (!/^\d{12}$/.test(cleanAadhar)) {
      return res.status(400).json({
        message: 'Please enter a valid 12-digit Aadhar number'
      });
    }

    // Check if user exists with this Aadhar number in your existing data
    const user = await UserMapping.findByAadhar(cleanAadhar);

    if (!user) {
      return res.status(404).json({
        message: 'No user found with this Aadhar number. Please register first.',
        code: 'USER_NOT_FOUND'
      });
    }

    // All users in your existing data are considered active
    // No need to check isActive since it's not in your data structure

    // Generate and save OTP
    const otpDoc = await OTP.createOTP(cleanAadhar);

    // In a real application, you would send this OTP via SMS/Email
    // For development, we'll return it in the response
    console.log(`OTP for ${cleanAadhar}: ${otpDoc.otp}`);

    res.json({
      message: 'OTP sent successfully',
      aadharNumber: user.formattedAadhar,
      userName: user.NAME,
      expiresIn: '5 minutes',
      // Remove this in production - only for development
      otp: process.env.NODE_ENV === 'development' ? otpDoc.otp : undefined
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

// @desc    Verify OTP and login user
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { aadharNumber, otp } = req.body;

    if (!aadharNumber || !otp) {
      return res.status(400).json({
        message: 'Aadhar number and OTP are required'
      });
    }

    // Clean Aadhar number
    const cleanAadhar = aadharNumber.replace(/\s/g, '');

    // Validate Aadhar format
    if (!/^\d{12}$/.test(cleanAadhar)) {
      return res.status(400).json({
        message: 'Please enter a valid 12-digit Aadhar number'
      });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: 'Please enter a valid 6-digit OTP'
      });
    }

    // Find user by Aadhar number in your existing data
    const user = await UserMapping.findByAadhar(cleanAadhar);

    if (!user) {
      return res.status(404).json({
        message: 'No user found with this Aadhar number'
      });
    }

    // All users in your existing data are considered active

    // Verify OTP
    const isOTPValid = await OTP.verifyOTP(cleanAadhar, otp);

    if (!isOTPValid) {
      return res.status(401).json({
        message: 'Invalid or expired OTP. Please request a new one.',
        code: 'INVALID_OTP'
      });
    }

    // Generate JWT token using the MongoDB _id
    const token = generateToken(user._id);

    // Transform user data for API response
    const userData = user.toJSON();
    userData.token = token;

    res.json({
      message: 'Login successful',
      ...userData
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// @desc    Login user with Aadhar (Legacy - kept for backward compatibility)
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { aadharNumber } = req.body;

    // Find user by Aadhar number
    const user = await User.findOne({
      aadharNumber: aadharNumber.replace(/\s/g, '')
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid Aadhar number'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      aadharNumber: user.formattedAadhar,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      location: user.location,
      isVerified: user.isVerified,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'firstName', 'lastName', 'phoneNumber', 'location', 
      'farmDetails', 'preferences'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      aadharNumber: updatedUser.formattedAadhar,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      userType: updatedUser.userType,
      location: updatedUser.location,
      farmDetails: updatedUser.farmDetails,
      preferences: updatedUser.preferences,
      isVerified: updatedUser.isVerified
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-__v');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get users by location
// @route   GET /api/users/location/:state/:district
// @access  Public
const getUsersByLocation = async (req, res) => {
  try {
    const { state, district } = req.params;
    const users = await User.findByLocation(state, district).select('-__v');
    
    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users by location error:', error);
    res.status(500).json({
      message: 'Error fetching users by location',
      error: error.message
    });
  }
};

// @desc    Get farmers only
// @route   GET /api/users/farmers
// @access  Public
const getFarmers = async (req, res) => {
  try {
    const farmers = await User.findFarmers().select('-__v');
    
    res.json({
      count: farmers.length,
      farmers
    });
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({
      message: 'Error fetching farmers',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  sendOTP,
  verifyOTP,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUsersByLocation,
  getFarmers
};
