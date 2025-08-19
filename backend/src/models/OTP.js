const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  aadharNumber: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
otpSchema.index({ aadharNumber: 1, otp: 1 });

// TTL index for automatic expiration after 5 minutes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.isUsed && new Date() < this.expiresAt;
};

// Method to mark OTP as used
otpSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create OTP for Aadhar
otpSchema.statics.createOTP = async function(aadharNumber) {
  const otp = this.generateOTP();
  
  // Delete any existing OTPs for this Aadhar
  await this.deleteMany({ aadharNumber });
  
  // Create new OTP
  return await this.create({
    aadharNumber,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(aadharNumber, otp) {
  const otpDoc = await this.findOne({ 
    aadharNumber, 
    otp, 
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (otpDoc) {
    await otpDoc.markAsUsed();
    return true;
  }
  
  return false;
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
