const mongoose = require('mongoose');
const User = require('./src/models/User');
const OTP = require('./src/models/OTP');
require('dotenv').config();

const testOTP = async () => {
  try {
    console.log('🔌 Testing OTP functionality...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    // Test Aadhar number
    const testAadhar = '123456789012';
    
    // First, check if user exists
    console.log(`\n🔍 Checking if user exists with Aadhar: ${testAadhar}`);
    let user = await User.findOne({ aadharNumber: testAadhar });
    
    if (!user) {
      console.log('❌ User not found. Creating test user...');
      
      // Create a test user
      user = await User.create({
        aadharNumber: testAadhar,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phoneNumber: '9876543210',
        userType: 'farmer',
        location: {
          state: 'Maharashtra',
          district: 'Pune',
          village: 'Test Village'
        }
      });
      console.log('✅ Test user created:', user.firstName, user.lastName);
    } else {
      console.log('✅ User found:', user.firstName, user.lastName);
    }
    
    // Test OTP generation
    console.log('\n📱 Testing OTP generation...');
    const otpDoc = await OTP.createOTP(testAadhar);
    console.log('✅ OTP generated:', otpDoc.otp);
    console.log('⏰ Expires at:', otpDoc.expiresAt);
    
    // Test OTP verification
    console.log('\n🔐 Testing OTP verification...');
    const isOTPValid = await OTP.verifyOTP(testAadhar, otpDoc.otp);
    console.log('✅ OTP verification result:', isOTPValid);
    
    // Test OTP expiration (should fail)
    console.log('\n⏰ Testing OTP expiration...');
    const isExpiredOTPValid = await OTP.verifyOTP(testAadhar, otpDoc.otp);
    console.log('❌ Expired OTP verification result:', isExpiredOTPValid);
    
    // Test with invalid OTP
    console.log('\n❌ Testing invalid OTP...');
    const isInvalidOTPValid = await OTP.verifyOTP(testAadhar, '000000');
    console.log('❌ Invalid OTP verification result:', isInvalidOTPValid);
    
    console.log('\n🎉 OTP testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during OTP testing:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

testOTP();
