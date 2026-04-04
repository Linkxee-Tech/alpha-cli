const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/alpha-cli';
  try {
    console.log(`📡 Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(uri, {
      connectTimeoutMS: 5000, // Fail fast (5s) instead of hanging
      serverSelectionTimeoutMS: 5000, 
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error(`💡 Tip: Ensure MONGO_URI is set correctly in your environment variables.`);
    process.exit(1);
  }
};

module.exports = connectDB;
