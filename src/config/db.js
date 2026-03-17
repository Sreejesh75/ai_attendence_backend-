const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-app';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected Successfully!');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.warn('Backend is running, but database connection failed. Please ensure MongoDB is running or update MONGO_URI in .env');
    // Not exiting process so that Swagger UI can still be viewed
  }
};

module.exports = connectDB;
