const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  aadharNumber: {
    type: String,
    required: [true, 'Aadhar number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Aadhar number must be exactly 12 digits'
    }
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['farmer', 'agricultural-expert', 'student', 'researcher', 'dealer'],
    default: 'farmer'
  },
  location: {
    state: {
      type: String,
      required: [true, 'State is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    village: {
      type: String,
      required: [true, 'Village is required']
    }
  },
  farmDetails: {
    totalAcres: {
      type: Number,
      min: [0, 'Total acres cannot be negative']
    },
    primaryCrops: [{
      type: String,
      trim: true
    }],
    irrigationType: {
      type: String,
      enum: ['rainfed', 'irrigated', 'mixed'],
      default: 'rainfed'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    language: {
      type: String,
      enum: ['english', 'hindi', 'marathi', 'gujarati', 'punjabi'],
      default: 'english'
    },
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Index for better query performance (only unique fields need explicit indexes)
userSchema.index({ phoneNumber: 1 });
userSchema.index({ 'location.state': 1, 'location.district': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted Aadhar
userSchema.virtual('formattedAadhar').get(function() {
  const aadhar = this.aadharNumber.replace(/\s/g, '');
  return aadhar.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// Method to check if user is a farmer
userSchema.methods.isFarmer = function() {
  return this.userType === 'farmer';
};

// Method to get user location string
userSchema.methods.getLocationString = function() {
  return `${this.location.village}, ${this.location.district}, ${this.location.state}`;
};

// Pre-save middleware to format Aadhar number
userSchema.pre('save', function(next) {
  if (this.isModified('aadharNumber')) {
    this.aadharNumber = this.aadharNumber.replace(/\s/g, '');
  }
  next();
});

// Pre-save middleware to format phone number
userSchema.pre('save', function(next) {
  if (this.isModified('phoneNumber')) {
    this.phoneNumber = this.phoneNumber.replace(/\s/g, '');
  }
  next();
});

// Static method to find users by location
userSchema.statics.findByLocation = function(state, district) {
  return this.find({
    'location.state': state,
    'location.district': district
  });
};

// Static method to find farmers
userSchema.statics.findFarmers = function() {
  return this.find({ userType: 'farmer' });
};

// JSON transformation
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
