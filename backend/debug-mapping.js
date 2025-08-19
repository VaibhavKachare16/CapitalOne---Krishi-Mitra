const mongoose = require('mongoose');
const UserMapping = require('./src/models/UserMapping');

const debugMapping = async () => {
  try {
    // Connect to your database
    await mongoose.connect('mongodb+srv://rushijadhav1423:f1cZEBsuXv12lgFF@cluster0.tprd9jf.mongodb.net/krishi-data?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database');
    
    // Test 1: Direct query on the collection
    console.log('\n🔍 Test 1: Direct collection query');
    const db = mongoose.connection.db;
    const coll = db.collection('aadhar');
    const directResult = await coll.findOne({ AADHAAR_NO: 111122223333 });
    console.log('Direct query result:', directResult);
    
    // Test 2: Use the UserMapping model to find all users
    console.log('\n🔍 Test 2: UserMapping.find() - get all users');
    const allUsers = await UserMapping.find({}).limit(3);
    console.log('All users count:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`, user.toJSON());
    });
    
    // Test 3: Test the findByAadhar method specifically
    console.log('\n🔍 Test 3: UserMapping.findByAadhar("111122223333")');
    const user1 = await UserMapping.findByAadhar('111122223333');
    console.log('findByAadhar result:', user1 ? user1.toJSON() : 'null');
    
    // Test 4: Try direct query with UserMapping
    console.log('\n🔍 Test 4: Direct UserMapping.findOne({ AADHAAR_NO: 111122223333 })');
    const user2 = await UserMapping.findOne({ AADHAAR_NO: 111122223333 });
    console.log('Direct UserMapping query:', user2 ? user2.toJSON() : 'null');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

debugMapping();

