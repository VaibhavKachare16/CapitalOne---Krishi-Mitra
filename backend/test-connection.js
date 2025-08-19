const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📡 Connection string:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔑 Connection ready state: ${conn.connection.readyState}`);
    
    // Test creating a collection
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📚 Existing collections: ${collections.map(c => c.name).join(', ')}`);
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
