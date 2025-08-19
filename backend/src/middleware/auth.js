const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = decoded;

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      message: 'Not authorized, no token'
    });
  }
};

// Optional auth middleware for routes that can work with or without auth
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without user
      console.log('Invalid token in optional auth:', error.message);
    }
  }

  next();
};

// Admin middleware
const admin = async (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    res.status(403).json({
      message: 'Not authorized as admin'
    });
  }
};

// Farmer middleware
const farmer = async (req, res, next) => {
  if (req.user && req.user.userType === 'farmer') {
    next();
  } else {
    res.status(403).json({
      message: 'Not authorized as farmer'
    });
  }
};

module.exports = { protect, optionalAuth, admin, farmer };
