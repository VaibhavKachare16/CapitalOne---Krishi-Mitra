const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

const testAPI = async () => {
  try {
    console.log('🚀 Testing Krishi Mitra API endpoints...\n');

    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    try {
      const healthResponse = await axios.get('http://localhost:5001/health');
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Send OTP for non-existent user
    console.log('\n2️⃣ Testing OTP for non-existent user...');
    try {
      const sendOTPResponse = await axios.post(`${API_BASE}/users/send-otp`, {
        aadharNumber: '999999999999'
      });
      console.log('❌ Should have failed:', sendOTPResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly rejected non-existent user:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Send OTP for existing user
    console.log('\n3️⃣ Testing OTP for existing user...');
    try {
      const sendOTPResponse = await axios.post(`${API_BASE}/users/send-otp`, {
        aadharNumber: '123456789012'
      });
      console.log('✅ OTP sent successfully:', sendOTPResponse.data.message);
      console.log('📱 OTP (dev mode):', sendOTPResponse.data.otp);
      
      const otp = sendOTPResponse.data.otp;
      
      // Test 4: Verify OTP
      console.log('\n4️⃣ Testing OTP verification...');
      const verifyOTPResponse = await axios.post(`${API_BASE}/users/verify-otp`, {
        aadharNumber: '123456789012',
        otp: otp
      });
      console.log('✅ OTP verified successfully:', verifyOTPResponse.data.message);
      console.log('🔑 Token received:', verifyOTPResponse.data.token ? 'Yes' : 'No');
      console.log('👤 User:', verifyOTPResponse.data.firstName, verifyOTPResponse.data.lastName);
      
      // Test 5: Try to verify same OTP again (should fail)
      console.log('\n5️⃣ Testing OTP reuse (should fail)...');
      try {
        await axios.post(`${API_BASE}/users/verify-otp`, {
          aadharNumber: '123456789012',
          otp: otp
        });
        console.log('❌ Should have failed - OTP already used');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Correctly rejected reused OTP:', error.response.data.message);
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Error in OTP flow:', error.response ? error.response.data : error.message);
    }

    // Test 6: Get farmers list
    console.log('\n6️⃣ Testing get farmers endpoint...');
    try {
      const farmersResponse = await axios.get(`${API_BASE}/users/farmers`);
      console.log('✅ Farmers retrieved:', farmersResponse.data.count, 'farmers found');
    } catch (error) {
      console.log('❌ Get farmers failed:', error.response ? error.response.data : error.message);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Wait a bit for server to start
setTimeout(testAPI, 2000);
