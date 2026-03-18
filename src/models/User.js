const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    // Optional initially, set after OTP verification
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  name: {
    type: String,
    default: 'System Admin'
  },
  role: {
    type: String,
    enum: ['Supervisor', 'Engineer', 'Owner', 'Admin'],
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
