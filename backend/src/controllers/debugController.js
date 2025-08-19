const UserMapping = require('../models/UserMapping');

// Debug endpoint to test UserMapping
const debugUser = async (req, res) => {
  try {
    const { aadharNumber } = req.params;
    
    console.log(`🔍 Debug: Looking for Aadhar: ${aadharNumber}`);
    
    // Test the findByAadhar method
    const user = await UserMapping.findByAadhar(aadharNumber);
    
    if (user) {
      console.log(`✅ Debug: User found - ${user.NAME}`);
      res.json({
        message: 'User found!',
        user: user.toJSON()
      });
    } else {
      console.log(`❌ Debug: User not found`);
      
      // Get all users for comparison
      const allUsers = await UserMapping.find({}).limit(5);
      res.json({
        message: 'User not found',
        availableAadhars: allUsers.map(u => u.AADHAAR_NO.toString())
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { debugUser };

