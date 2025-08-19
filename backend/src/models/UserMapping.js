const mongoose = require('mongoose');

// This model maps to your existing 'aadhar' collection structure
const userMappingSchema = new mongoose.Schema({
  AADHAAR_NO: {
    type: Number,  // Your data stores this as number
    required: true,
    unique: true
  },
  NAME: {
    type: String,
    required: true,
    trim: true
  },
  PHONE_NO: {
    type: Number,  // Your data stores this as number
    required: true
  },
  STATE: {
    type: String,
    required: true,
    trim: true
  },
  DISTRICT: {
    type: String,
    required: true,
    trim: true
  },
  ADDRESS: {
    type: String,
    required: true,
    trim: true
  }
}, {
  collection: 'aadhar',  // Use your existing collection name
  timestamps: false      // Your existing data doesn't have timestamps
});

// Virtual to format Aadhar as string for API responses
userMappingSchema.virtual('formattedAadhar').get(function() {
  const aadhar = this.AADHAAR_NO.toString();
  return aadhar.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// Virtual to split name into first and last
userMappingSchema.virtual('firstName').get(function() {
  const names = this.NAME.split(' ');
  return names[0];
});

userMappingSchema.virtual('lastName').get(function() {
  const names = this.NAME.split(' ');
  return names.slice(1).join(' ') || names[0]; // If only one name, use it as lastName too
});

// Virtual to format phone as string
userMappingSchema.virtual('phoneNumber').get(function() {
  return this.PHONE_NO.toString();
});

// Method to get location string
userMappingSchema.methods.getLocationString = function() {
  return `${this.DISTRICT}, ${this.STATE}`;
};

// Static method to find by Aadhar number (handles string to number conversion)
userMappingSchema.statics.findByAadhar = function(aadharNumber) {
  // Convert string to number for database query
  const aadharNum = typeof aadharNumber === 'string' ? 
    parseInt(aadharNumber.replace(/\s/g, ''), 10) : aadharNumber;
  
  return this.findOne({ AADHAAR_NO: aadharNum });
};

// JSON transformation to match expected API response format
userMappingSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Transform to expected API format
  return {
    _id: user._id,
    aadharNumber: user.AADHAAR_NO.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: user.NAME,
    email: `${this.firstName.toLowerCase()}@farmer.com`, // Default email since not in your data
    phoneNumber: user.PHONE_NO.toString(),
    userType: 'farmer', // Default since not in your data
    location: {
      state: user.STATE,
      district: user.DISTRICT,
      village: user.ADDRESS
    },
    isVerified: true,
    isActive: true
  };
};

const UserMapping = mongoose.model('UserMapping', userMappingSchema);

module.exports = UserMapping;

