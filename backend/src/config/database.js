const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use your MongoDB Atlas connection with krishi-data database
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://rushijadhav1423:f1cZEBsuXv12lgFF@cluster0.tprd9jf.mongodb.net/krishi-data?retryWrites=true&w=majority&appName=Cluster0';
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
